import { desc, eq, sql } from "drizzle-orm";
import db from "./db.js";
import { user } from "./schema.js";

export type UserRecord = {
  id: number;
  username: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
};

const toUserRecord = (row: {
  id: number;
  username: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}): UserRecord => ({
  id: row.id,
  username: row.username,
  enabled: row.enabled,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  lastLoginAt: row.lastLoginAt,
});

export const countUsers = async (): Promise<number> => {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user);
  return row?.count ?? 0;
};

export const insertUser = async (input: {
  username: string;
  passwordHash: string;
}): Promise<{ id: number; username: string }> => {
  const [created] = await db
    .insert(user)
    .values({
      username: input.username,
      passwordHash: input.passwordHash,
    })
    .returning({
      id: user.id,
      username: user.username,
    });

  if (!created) {
    throw new Error("Failed to create user.");
  }

  return created;
};

const parseFirstUserLockKey = (): number => {
  const raw = process.env.CMS_FIRST_USER_LOCK_KEY?.trim();
  if (!raw) {
    throw new Error("CMS_FIRST_USER_LOCK_KEY is required.");
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    throw new Error("CMS_FIRST_USER_LOCK_KEY must be an integer.");
  }

  return parsed;
};

/** Postgres advisory lock key for first-user bootstrap. */
const FIRST_USER_LOCK_KEY = parseFirstUserLockKey();

/**
 * Create the first user only when the table is empty.
 * Uses a transaction advisory lock so concurrent bootstrap cannot
 * create two admins.
 */
export const insertFirstUserIfEmpty = async (input: {
  username: string;
  passwordHash: string;
}): Promise<{ id: number; username: string } | null> => {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${FIRST_USER_LOCK_KEY})`);

    const [row] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(user);

    if ((row?.count ?? 0) > 0) {
      return null;
    }

    const [created] = await tx
      .insert(user)
      .values({
        username: input.username,
        passwordHash: input.passwordHash,
      })
      .returning({
        id: user.id,
        username: user.username,
      });

    if (!created) {
      throw new Error("Failed to create user.");
    }

    return created;
  });
};

export const listUsers = async (): Promise<UserRecord[]> => {
  const rows = await db
    .select({
      id: user.id,
      username: user.username,
      enabled: user.enabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt), desc(user.id));

  return rows;
};

export const findUserByUsername = async (
  username: string,
): Promise<(UserRecord & { passwordHash: string }) | null> => {
  const [row] = await db
    .select()
    .from(user)
    .where(eq(user.username, username));

  if (!row) {
    return null;
  }

  return {
    ...toUserRecord(row),
    passwordHash: row.passwordHash,
  };
};

export const findUserById = async (id: number): Promise<UserRecord | null> => {
  const [row] = await db
    .select({
      id: user.id,
      username: user.username,
      enabled: user.enabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    })
    .from(user)
    .where(eq(user.id, id));

  if (!row) {
    return null;
  }

  return toUserRecord(row);
};

export const disableUser = async (id: number): Promise<void> => {
  const [updated] = await db
    .update(user)
    .set({ enabled: false, updatedAt: new Date() })
    .where(eq(user.id, id))
    .returning({ id: user.id });

  if (!updated) {
    throw new Error(`User ${id} not found.`);
  }
};

export const touchUserLastLogin = async (id: number): Promise<void> => {
  await db
    .update(user)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(user.id, id));
};
