import { createHash } from "node:crypto";
import {
  apiKeyScopeValues,
  type ApiKeyScope,
} from "@packages/cms-db/schema";

export type { ApiKeyScope };
export { apiKeyScopeValues };

export const hashApiKey = (rawKey: string, pepper: string): string =>
  createHash("sha256").update(`${pepper}${rawKey}`).digest("hex");

export const isApiKeyScope = (value: unknown): value is ApiKeyScope =>
  typeof value === "string" &&
  (apiKeyScopeValues as readonly string[]).includes(value);

export const scopeAllowsMethod = (
  scope: ApiKeyScope,
  method: string,
): boolean => {
  const normalized = method.toUpperCase();

  if (normalized === "GET" || normalized === "HEAD") {
    return scope === "read" || scope === "read_write";
  }

  if (
    normalized === "POST" ||
    normalized === "PUT" ||
    normalized === "PATCH" ||
    normalized === "DELETE"
  ) {
    return scope === "write" || scope === "read_write";
  }

  return false;
};
