import { and, desc, eq, sql } from "drizzle-orm";
import db from "./db.js";
import { account, session, user } from "./schema.js";

export type UserRecord = {
  id: string;
  username: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** Synthetic email for username-only accounts (Better Auth requires email). */
export const emailForUsername = (username: string): string =>
  `${username.toLowerCase()}@users.wafercms.local`;

const toUserRecord = (row: {
  id: string;
  username: string | null;
  enabled: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}): UserRecord => ({
  id: row.id,
  username: row.username ?? "",
  enabled: row.enabled ?? true,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const newId = (): string => crypto.randomUUID();

export const countUsers = async (): Promise<number> => {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user);
  return row?.count ?? 0;
};

export const insertUser = async (input: {
  username: string;
  passwordHash: string;
}): Promise<{ id: string; username: string }> => {
  const username = input.username.trim();
  const normalized = username.toLowerCase();
  const id = newId();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(user).values({
      id,
      name: username,
      email: emailForUsername(normalized),
      emailVerified: true,
      username: normalized,
      displayUsername: username,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(account).values({
      id: newId(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: input.passwordHash,
      createdAt: now,
      updatedAt: now,
    });
  });

  return { id, username: normalized };
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
}): Promise<{ id: string; username: string } | null> => {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${FIRST_USER_LOCK_KEY})`);

    const [row] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(user);

    if ((row?.count ?? 0) > 0) {
      return null;
    }

    const username = input.username.trim();
    const normalized = username.toLowerCase();
    const id = newId();
    const now = new Date();

    await tx.insert(user).values({
      id,
      name: username,
      email: emailForUsername(normalized),
      emailVerified: true,
      username: normalized,
      displayUsername: username,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(account).values({
      id: newId(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: input.passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    return { id, username: normalized };
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
    })
    .from(user)
    .orderBy(desc(user.createdAt), desc(user.id));

  return rows.map(toUserRecord);
};

export const findUserByUsername = async (
  username: string,
): Promise<UserRecord | null> => {
  const [row] = await db
    .select({
      id: user.id,
      username: user.username,
      enabled: user.enabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(eq(user.username, username.toLowerCase()));

  if (!row) {
    return null;
  }

  return toUserRecord(row);
};

export const findUserById = async (id: string): Promise<UserRecord | null> => {
  const [row] = await db
    .select({
      id: user.id,
      username: user.username,
      enabled: user.enabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(eq(user.id, id));

  if (!row) {
    return null;
  }

  return toUserRecord(row);
};

export const disableUser = async (id: string): Promise<void> => {
  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(user)
      .set({ enabled: false, updatedAt: new Date() })
      .where(and(eq(user.id, id)))
      .returning({ id: user.id });

    if (!updated) {
      throw new Error(`User ${id} not found.`);
    }

    await tx.delete(session).where(eq(session.userId, id));
  });
};
