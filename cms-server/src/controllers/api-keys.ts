import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { insertApiKey, listApiKeys, revokeApiKey } from "@packages/cms-db/api-keys";
import {
  hashApiKey,
  isApiKeyScope,
  type ApiKeyScope,
} from "../lib/api-keys";
import { isNonEmptyString } from "../lib/validation";
import { parseIdParam, sendRouteError } from "../lib/http";

const getPepper = (): string => {
  const pepper = process.env.CMS_API_KEY_PEPPER?.trim();
  if (!pepper) {
    throw new Error("CMS API key auth is not configured.");
  }
  return pepper;
};

const generateRawApiKey = (): string =>
  `cms_${randomBytes(32).toString("hex")}`;

const listApiKeysData = async () => listApiKeys();

const createApiKeyData = async (input: { label: string; scope: ApiKeyScope }) => {
  const label = input.label.trim();
  if (!label) {
    throw new Error("Label is required.");
  }

  const rawKey = generateRawApiKey();
  const record = await insertApiKey({
    label,
    keyPrefix: rawKey.slice(0, 8),
    keyHash: hashApiKey(rawKey, getPepper()),
    scope: input.scope,
  });
  return { ...record, rawKey };
};

const revokeApiKeyData = async (id: number) => revokeApiKey(id);

export const listApiKeysHandler = async (_req: Request, res: Response) => {
  try {
    const keys = await listApiKeysData();
    res.json({ data: keys });
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const createApiKeyHandler = async (req: Request, res: Response) => {
  try {
    const { label, scope } = req.body as {
      label?: unknown;
      scope?: unknown;
    };

    if (!isNonEmptyString(label)) {
      res.status(400).json({ error: "Label is required." });
      return;
    }

    if (!isApiKeyScope(scope)) {
      res.status(400).json({ error: "Invalid scope." });
      return;
    }

    const record = await createApiKeyData({ label, scope });
    res.status(201).json(record);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const revokeApiKeyHandler = async (req: Request, res: Response) => {
  try {
    const { enabled } = req.body as { enabled?: unknown };

    if (enabled !== false) {
      res.status(400).json({ error: "Only revocation is supported." });
      return;
    }

    const record = await revokeApiKeyData(parseIdParam(String(req.params.id)));
    res.json(record);
  } catch (error) {
    sendRouteError(res, error);
  }
};
