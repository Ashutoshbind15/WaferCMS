import type { NextFunction, Request, Response } from "express";
import {
  findEnabledApiKeyByHash,
  hashApiKey,
  scopeAllowsMethod,
  touchApiKeyLastUsed,
} from "@packages/cms-db/api-keys";

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

const parseBearerToken = (authorization: string | undefined): string | null => {
  if (!authorization) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return match?.[1]?.trim() || null;
};

const parseIpv4 = (ip: string): number[] | null => {
  const normalized = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  const parts = normalized.split(".");
  if (parts.length !== 4) {
    return null;
  }

  const bytes: number[] = [];
  for (const part of parts) {
    const value = Number.parseInt(part, 10);
    if (!Number.isInteger(value) || value < 0 || value > 255) {
      return null;
    }
    bytes.push(value);
  }

  return bytes;
};

const ipInCidr = (ip: string, cidr: string): boolean => {
  const [network, prefixRaw] = cidr.split("/");
  const prefix = prefixRaw ? Number.parseInt(prefixRaw, 10) : 32;
  if (!network || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return false;
  }

  const ipBytes = parseIpv4(ip);
  const networkBytes = parseIpv4(network);
  if (!ipBytes || !networkBytes) {
    return false;
  }

  const ipValue =
    (ipBytes[0]! << 24) |
    (ipBytes[1]! << 16) |
    (ipBytes[2]! << 8) |
    ipBytes[3]!;
  const networkValue =
    (networkBytes[0]! << 24) |
    (networkBytes[1]! << 16) |
    (networkBytes[2]! << 8) |
    networkBytes[3]!;
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;

  return (ipValue & mask) === (networkValue & mask);
};

const isBypassedIp = (ip: string | undefined): boolean => {
  if (!ip) {
    return false;
  }

  const cidrs =
    process.env.CMS_AUTH_BYPASS_CIDRS?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];

  return cidrs.some((cidr) => ipInCidr(ip, cidr));
};

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
  if (req.method === "GET" && req.path === "/ok") {
    next();
    return;
  }

  if (!authRequired()) {
    next();
    return;
  }

  if (isBypassedIp(req.ip)) {
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
