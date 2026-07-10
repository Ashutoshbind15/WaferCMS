import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { insertApiKey, listApiKeys, revokeApiKey } from "@packages/cms-db/api-keys";
import { hashApiKey } from "../lib/api-keys.js";
import { parseIdParam, sendNoContent } from "../lib/http.js";
import type { CreateApiKeyBody } from "../lib/validation.js";

const getPepper = (): string | null => {
  const pepper = process.env.CMS_API_KEY_PEPPER?.trim();
  return pepper || null;
};

const generateRawApiKey = (): string =>
  `cms_${randomBytes(32).toString("hex")}`;

export const listApiKeysHandler = async (_req: Request, res: Response) => {
  try {
    const keys = await listApiKeys();
    res.json({ data: keys });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    res.status(500).json({ error: message });
  }
};

export const createApiKeyHandler = async (req: Request, res: Response) => {
  const pepper = getPepper();
  if (!pepper) {
    res.status(500).json({ error: "CMS API key auth is not configured." });
    return;
  }

  const input = req.body as CreateApiKeyBody;
  const rawKey = generateRawApiKey();

  try {
    const record = await insertApiKey({
      label: input.label,
      keyPrefix: rawKey.slice(0, 8),
      keyHash: hashApiKey(rawKey, pepper),
      scope: input.scope,
    });
    res.status(201).json({ ...record, rawKey });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    res.status(500).json({ error: message });
  }
};

export const revokeApiKeyHandler = async (req: Request, res: Response) => {
  const id = parseIdParam(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  try {
    await revokeApiKey(id);
    sendNoContent(res);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    if (message.endsWith("not found.")) {
      res.status(404).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
};
