import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import db from "./db";
import { collectionData, collectionDataValue, collectionField } from "./schema";

export type CollectionDataRow = typeof collectionData.$inferSelect;

export type CollectionDataValueRow = {
  dataId: number;
  fieldKey: string;
  value: unknown;
};

export type CollectionDataValueInput = {
  dataId: number;
  fieldId: number;
  value: unknown;
};

/** Accepts either the root db client or a transaction client. */
type DbClient =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];

const withClient = (client: DbClient | undefined) => client ?? db;

export const countCollectionData = async (
  collectionId: number,
): Promise<number> => {
  const [row] = await db
    .select({ value: count() })
    .from(collectionData)
    .where(eq(collectionData.collectionId, collectionId));
  return row?.value ?? 0;
};

export const selectCollectionDataPage = async (
  collectionId: number,
  limit: number,
  offset: number,
): Promise<CollectionDataRow[]> => {
  return db
    .select()
    .from(collectionData)
    .where(eq(collectionData.collectionId, collectionId))
    .orderBy(desc(collectionData.updatedAt), desc(collectionData.id))
    .limit(limit)
    .offset(offset);
};

export const selectCollectionDataById = async (
  collectionId: number,
  dataId: number,
): Promise<CollectionDataRow | null> => {
  const [row] = await db
    .select()
    .from(collectionData)
    .where(
      and(
        eq(collectionData.id, dataId),
        eq(collectionData.collectionId, collectionId),
      ),
    );
  return row ?? null;
};

export const selectCollectionDataValuesForIds = async (
  dataIds: number[],
): Promise<CollectionDataValueRow[]> => {
  return db
    .select({
      dataId: collectionDataValue.dataId,
      fieldKey: collectionField.key,
      value: collectionDataValue.value,
    })
    .from(collectionDataValue)
    .innerJoin(
      collectionField,
      eq(collectionDataValue.fieldId, collectionField.id),
    )
    .where(inArray(collectionDataValue.dataId, dataIds));
};

export const insertCollectionData = async (
  collectionId: number,
  client?: DbClient,
): Promise<CollectionDataRow> => {
  const [created] = await withClient(client)
    .insert(collectionData)
    .values({ collectionId, updatedAt: new Date() })
    .returning();
  if (!created) {
    throw new Error("Failed to create collection item.");
  }
  return created;
};

export const insertCollectionDataValues = async (
  rows: CollectionDataValueInput[],
  client?: DbClient,
): Promise<void> => {
  await withClient(client)
    .insert(collectionDataValue)
    .values(
      rows.map((row) => ({
        dataId: row.dataId,
        fieldId: row.fieldId,
        value: row.value,
        updatedAt: new Date(),
      })),
    );
};

export const upsertCollectionDataValues = async (
  rows: CollectionDataValueInput[],
  client?: DbClient,
): Promise<void> => {
  await withClient(client)
    .insert(collectionDataValue)
    .values(
      rows.map((row) => ({
        dataId: row.dataId,
        fieldId: row.fieldId,
        value: row.value,
        updatedAt: new Date(),
      })),
    )
    .onConflictDoUpdate({
      target: [collectionDataValue.dataId, collectionDataValue.fieldId],
      set: {
        value: sql`excluded."value"`,
        updatedAt: new Date(),
      },
    });
};

export const touchCollectionData = async (
  dataId: number,
  client?: DbClient,
): Promise<void> => {
  await withClient(client)
    .update(collectionData)
    .set({ updatedAt: new Date() })
    .where(eq(collectionData.id, dataId));
};

export const deleteCollectionData = async (
  collectionId: number,
  dataId: number,
): Promise<boolean> => {
  const [deleted] = await db
    .delete(collectionData)
    .where(
      and(
        eq(collectionData.id, dataId),
        eq(collectionData.collectionId, collectionId),
      ),
    )
    .returning({ id: collectionData.id });
  return Boolean(deleted);
};
