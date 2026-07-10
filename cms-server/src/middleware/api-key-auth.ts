import type { NextFunction, Request, Response } from "express";
import {
  findEnabledApiKeyByHash,
  touchApiKeyLastUsed,
} from "@packages/cms-db/api-keys";
import { hashApiKey, scopeAllowsMethod } from "../lib/api-keys.js";
import { parseBearerToken } from "../lib/auth.js";

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

export const apiKeyAuthRequired = (): boolean => authRequired();

const getPepper = (): string | null => {
  const pepper = process.env.CMS_API_KEY_PEPPER?.trim();
  return pepper || null;
};

/**
 * Validate a bearer API key without responding. Mirrors `trySessionAuth`:
 * returns the auth context when the key is enabled and its scope allows the
 * request method, otherwise `null`. Never throws on bad input. Used by
 * middleware that wants a soft check (e.g. file asset access).
 */
export const tryApiKeyAuth = async (
  req: Request,
): Promise<ApiKeyAuthContext | null> => {
  const pepper = getPepper();
  if (!pepper) {
    return null;
  }

  const rawKey = parseBearerToken(req.headers.authorization);
  if (!rawKey) {
    return null;
  }

  const keyHash = hashApiKey(rawKey, pepper);
  const record = await findEnabledApiKeyByHash(keyHash);
  if (!record) {
    return null;
  }

  if (!scopeAllowsMethod(record.scope, req.method)) {
    return null;
  }

  void touchApiKeyLastUsed(record.id).catch(() => {});

  return {
    apiKeyId: record.id,
    label: record.label,
    scope: record.scope,
  };
};

export const apiKeyAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
