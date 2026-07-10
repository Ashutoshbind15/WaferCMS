import { desc, eq } from "drizzle-orm";
import db from "./db.js";
import { apiKey, type ApiKeyScope } from "./schema.js";

export type { ApiKeyScope };
export { apiKeyScopeValues } from "./schema.js";

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

const toApiKeyRecord = (row: typeof apiKey.$inferSelect): ApiKeyRecord => ({
  id: row.id,
  label: row.label,
  keyPrefix: row.keyPrefix,
  scope: row.scope,
  enabled: row.enabled,
  createdAt: row.createdAt,
  lastUsedAt: row.lastUsedAt,
});

export const insertApiKey = async (input: {
  label: string;
  keyPrefix: string;
  keyHash: string;
  scope: ApiKeyScope;
}): Promise<ApiKeyRecord> => {
  const [created] = await db
    .insert(apiKey)
    .values({
      label: input.label,
      keyPrefix: input.keyPrefix,
      keyHash: input.keyHash,
      scope: input.scope,
    })
    .returning({
      id: apiKey.id,
      label: apiKey.label,
      keyPrefix: apiKey.keyPrefix,
      scope: apiKey.scope,
      enabled: apiKey.enabled,
      createdAt: apiKey.createdAt,
      lastUsedAt: apiKey.lastUsedAt,
    });

  if (!created) {
    throw new Error("Failed to create API key.");
  }

  return created;
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

export const revokeApiKey = async (id: number): Promise<void> => {
  const [updated] = await db
    .update(apiKey)
    .set({ enabled: false })
    .where(eq(apiKey.id, id))
    .returning({ id: apiKey.id });

  if (!updated) {
    throw new Error(`API key ${id} not found.`);
  }
};

export const touchApiKeyLastUsed = async (id: number): Promise<void> => {
  await db
    .update(apiKey)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKey.id, id));
};
