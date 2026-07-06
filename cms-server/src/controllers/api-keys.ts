import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { insertApiKey, listApiKeys, revokeApiKey } from "@packages/cms-db/api-keys";
import { hashApiKey } from "../lib/api-keys";
import { parseIdParam, sendRouteError } from "../lib/http";
import type { CreateApiKeyBody } from "../lib/validation";

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

const createApiKeyData = async (input: CreateApiKeyBody) => {
  const rawKey = generateRawApiKey();
  const record = await insertApiKey({
    label: input.label,
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
    const record = await createApiKeyData(req.body as CreateApiKeyBody);
    res.status(201).json(record);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const revokeApiKeyHandler = async (req: Request, res: Response) => {
  try {
    const record = await revokeApiKeyData(parseIdParam(String(req.params.id)));
    res.json(record);
  } catch (error) {
    sendRouteError(res, error);
  }
};
