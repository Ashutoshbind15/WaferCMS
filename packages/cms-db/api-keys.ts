import { createHash } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import db from "./db";
import {
  apiKey,
  apiKeyScopeValues,
  type ApiKeyScope,
} from "./schema";

export type { ApiKeyScope };
export { apiKeyScopeValues };

export type ApiKeyRecord = {
  id: number;
  label: string;
  keyPrefix: string;
  scope: ApiKeyScope;
  enabled: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
};

type ApiKeyAuthRecord = ApiKeyRecord & {
  keyHash: string;
};

export const hashApiKey = (rawKey: string, pepper: string): string =>
  createHash("sha256").update(`${pepper}${rawKey}`).digest("hex");

export const isApiKeyScope = (value: unknown): value is ApiKeyScope =>
  typeof value === "string" &&
  (apiKeyScopeValues as readonly string[]).includes(value);

const toApiKeyRecord = (row: typeof apiKey.$inferSelect): ApiKeyRecord => ({
  id: row.id,
  label: row.label,
  keyPrefix: row.keyPrefix,
  scope: row.scope,
  enabled: row.enabled,
  createdAt: row.createdAt,
  lastUsedAt: row.lastUsedAt,
});

export const createApiKey = async (input: {
  label: string;
  scope: ApiKeyScope;
  rawKey: string;
  pepper: string;
}): Promise<ApiKeyRecord> => {
  const label = input.label.trim();
  if (!label) {
    throw new Error("Label is required.");
  }

  const keyPrefix = input.rawKey.slice(0, 8);
  const keyHash = hashApiKey(input.rawKey, input.pepper);

  const [created] = await db
    .insert(apiKey)
    .values({
      label,
      keyPrefix,
      keyHash,
      scope: input.scope,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create API key.");
  }

  return toApiKeyRecord(created);
};

export const listApiKeys = async (): Promise<ApiKeyRecord[]> => {
  const rows = await db
    .select({
      id: apiKey.id,
      label: apiKey.label,
      keyPrefix: apiKey.keyPrefix,
      scope: apiKey.scope,
      enabled: apiKey.enabled,
      createdAt: apiKey.createdAt,
      lastUsedAt: apiKey.lastUsedAt,
    })
    .from(apiKey)
    .orderBy(desc(apiKey.createdAt), desc(apiKey.id));

  return rows;
};

export const findEnabledApiKeyByHash = async (
  keyHash: string,
): Promise<ApiKeyAuthRecord | null> => {
  const [row] = await db
    .select()
    .from(apiKey)
    .where(eq(apiKey.keyHash, keyHash));

  if (!row || !row.enabled) {
    return null;
  }

  return {
    ...toApiKeyRecord(row),
    keyHash: row.keyHash,
  };
};

export const revokeApiKey = async (id: number): Promise<ApiKeyRecord> => {
  const [updated] = await db
    .update(apiKey)
    .set({ enabled: false })
    .where(eq(apiKey.id, id))
    .returning();

  if (!updated) {
    throw new Error(`API key ${id} not found.`);
  }

  return toApiKeyRecord(updated);
};

export const touchApiKeyLastUsed = async (id: number): Promise<void> => {
  await db
    .update(apiKey)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKey.id, id));
};

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
