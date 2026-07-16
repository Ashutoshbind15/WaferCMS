import { and, count, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { touchCollectionRecord } from "./collections.js";
import db from "./db.js";
import { collectionData, collectionDataValue, collectionField } from "./schema.js";

export type CollectionDataRow = typeof collectionData.$inferSelect;

export type CollectionDataFilter = {
  includeDrafts: boolean;
};

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

const collectionDataConditions = (
  collectionId: number,
  filter: CollectionDataFilter,
): SQL => {
  const conditions = [eq(collectionData.collectionId, collectionId)];
  if (!filter.includeDrafts) {
    conditions.push(eq(collectionData.draft, false));
  }
  return and(...conditions)!;
};

export const countCollectionData = async (
  collectionId: number,
  filter: CollectionDataFilter,
): Promise<number> => {
  const [row] = await db
    .select({ value: count() })
    .from(collectionData)
    .where(collectionDataConditions(collectionId, filter));
  return row?.value ?? 0;
};

export const selectCollectionDataPage = async (
  collectionId: number,
  limit: number,
  offset: number,
  filter: CollectionDataFilter,
): Promise<CollectionDataRow[]> => {
  return db
    .select()
    .from(collectionData)
    .where(collectionDataConditions(collectionId, filter))
    .orderBy(desc(collectionData.updatedAt), desc(collectionData.id))
    .limit(limit)
    .offset(offset);
};

export const selectCollectionDataById = async (
  collectionId: number,
  dataId: number,
  filter: CollectionDataFilter,
): Promise<CollectionDataRow | null> => {
  const [row] = await db
    .select()
    .from(collectionData)
    .where(
      and(
        eq(collectionData.id, dataId),
        collectionDataConditions(collectionId, filter),
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
  options: { draft: boolean },
  client?: DbClient,
): Promise<{ id: number }> => {
  const [created] = await withClient(client)
    .insert(collectionData)
    .values({
      collectionId,
      draft: options.draft,
      updatedAt: new Date(),
    })
    .returning({ id: collectionData.id });
  if (!created) {
    throw new Error("Failed to create collection item.");
  }
  await touchCollectionRecord(collectionId, client);
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

export const updateCollectionData = async (
  collectionId: number,
  dataId: number,
  patch: { draft: boolean },
  client?: DbClient,
): Promise<void> => {
  await withClient(client)
    .update(collectionData)
    .set({ draft: patch.draft, updatedAt: new Date() })
    .where(
      and(
        eq(collectionData.id, dataId),
        eq(collectionData.collectionId, collectionId),
      ),
    );
  await touchCollectionRecord(collectionId, client);
};

export const deleteCollectionData = async (
  collectionId: number,
  dataId: number,
): Promise<void> => {
  const [deleted] = await db
    .delete(collectionData)
    .where(
      and(
        eq(collectionData.id, dataId),
        eq(collectionData.collectionId, collectionId),
      ),
    )
    .returning({ id: collectionData.id });
  if (!deleted) {
    throw new Error(`Collection item ${dataId} not found.`);
  }
  await touchCollectionRecord(collectionId);
};
