import type { NextFunction, Request, Response } from "express";
import {
  findEnabledApiKeyByHash,
  hashApiKey,
  scopeAllowsMethod,
  touchApiKeyLastUsed,
} from "@packages/cms-db/api-keys";
import { parseBearerToken } from "../lib/auth";

export type ApiKeyAuthContext = {
  apiKeyId: number;
  label: string;
  scope: "read" | "write" | "read_write";
};

declare global {
  namespace Express {
    interface Request {
      apiKeyAuth?: ApiKeyAuthContext;
    }
  }
}

const authRequired = (): boolean => process.env.CMS_REQUIRE_API_KEY === "true";

const getPepper = (): string | null => {
  const pepper = process.env.CMS_API_KEY_PEPPER?.trim();
  return pepper || null;
};

export const apiKeyAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.method === "OPTIONS") {
    next();
    return;
  }

  if (!authRequired()) {
    next();
    return;
  }

  const pepper = getPepper();
  if (!pepper) {
    res.status(500).json({ error: "CMS API key auth is not configured." });
    return;
  }

  const rawKey = parseBearerToken(req.headers.authorization);
  if (!rawKey) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  const keyHash = hashApiKey(rawKey, pepper);
  const record = await findEnabledApiKeyByHash(keyHash);
  if (!record) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  if (!scopeAllowsMethod(record.scope, req.method)) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }

  req.apiKeyAuth = {
    apiKeyId: record.id,
    label: record.label,
    scope: record.scope,
  };

  void touchApiKeyLastUsed(record.id).catch(() => {});

  next();
};
