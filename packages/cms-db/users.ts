import bcrypt from "bcryptjs";
import { desc, eq, sql } from "drizzle-orm";
import db from "./db";
import { user } from "./schema";

const BCRYPT_COST = 12;

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

export const hashPassword = async (password: string): Promise<string> =>
  bcrypt.hash(password, BCRYPT_COST);

export const countUsers = async (): Promise<number> => {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user);
  return row?.count ?? 0;
};

export const createUser = async (input: {
  username: string;
  password: string;
}): Promise<UserRecord> => {
  const username = input.username.trim();
  if (!username) {
    throw new Error("Username is required.");
  }
  if (!input.password) {
    throw new Error("Password is required.");
  }

  const existing = await findUserByUsername(username);
  if (existing) {
    throw new Error("Username already exists.");
  }

  const passwordHash = await hashPassword(input.password);

  const [created] = await db
    .insert(user)
    .values({
      username,
      passwordHash,
    })
    .returning({
      id: user.id,
      username: user.username,
      enabled: user.enabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    });

  if (!created) {
    throw new Error("Failed to create user.");
  }

  return toUserRecord(created);
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
    .where(eq(user.username, username.trim()));

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

export const verifyUserPassword = async (
  username: string,
  password: string,
): Promise<UserRecord | null> => {
  const record = await findUserByUsername(username);
  if (!record || !record.enabled) {
    return null;
  }

  const matches = await bcrypt.compare(password, record.passwordHash);
  if (!matches) {
    return null;
  }

  const { passwordHash: _, ...userRecord } = record;
  return userRecord;
};

export const disableUser = async (id: number): Promise<UserRecord> => {
  const [updated] = await db
    .update(user)
    .set({ enabled: false, updatedAt: new Date() })
    .where(eq(user.id, id))
    .returning({
      id: user.id,
      username: user.username,
      enabled: user.enabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    });

  if (!updated) {
    throw new Error(`User ${id} not found.`);
  }

  return toUserRecord(updated);
};

export const touchUserLastLogin = async (id: number): Promise<void> => {
  await db
    .update(user)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(user.id, id));
};
