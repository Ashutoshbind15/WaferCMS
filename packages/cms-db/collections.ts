import { and, asc, count, desc, eq } from "drizzle-orm";
import db from "./db";
import {
  type ListPageQuery,
  type PaginatedRows,
  paginateRows,
} from "./pagination";
import {
  collection,
  collectionField,
  type CollectionFieldType,
} from "./schema";

type CollectionRow = typeof collection.$inferSelect;
export type CollectionFieldRow = typeof collectionField.$inferSelect;

const normalizeSlug = (value: string) => value.trim().toLowerCase();

export const listCollectionRecords = async (
  query: ListPageQuery,
): Promise<PaginatedRows<CollectionRow>> => {
  return paginateRows({
    query,
    fetchPage: (limit, offset) =>
      db
        .select()
        .from(collection)
        .orderBy(desc(collection.updatedAt), desc(collection.id))
        .limit(limit)
        .offset(offset),
    fetchTotal: async () => {
      const [row] = await db.select({ value: count() }).from(collection);
      return row?.value ?? 0;
    },
  });
};

export const getCollectionRecord = async (
  id: number,
): Promise<CollectionRow | null> => {
  const [row] = await db
    .select()
    .from(collection)
    .where(eq(collection.id, id));
  return row ?? null;
};

export const getCollectionRecordBySlug = async (
  slug: string,
): Promise<CollectionRow | null> => {
  const [row] = await db
    .select()
    .from(collection)
    .where(eq(collection.slug, normalizeSlug(slug)));
  return row ?? null;
};

export const addCollectionRecord = async (input: {
  slug: string;
  title: string;
  description?: string | null;
}): Promise<CollectionRow> => {
  const [created] = await db
    .insert(collection)
    .values({
      slug: input.slug,
      title: input.title,
      description: input.description ?? null,
      updatedAt: new Date(),
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create collection.");
  }

  return created;
};

export const updateCollectionRecord = async (
  id: number,
  input: {
    slug: string;
    title: string;
    description?: string | null;
  },
): Promise<CollectionRow> => {
  const [updated] = await db
    .update(collection)
    .set({
      slug: input.slug,
      title: input.title,
      description: input.description ?? null,
      updatedAt: new Date(),
    })
    .where(eq(collection.id, id))
    .returning();

  if (!updated) {
    throw new Error(`Collection ${id} not found.`);
  }

  return updated;
};

export const deleteCollectionRecord = async (id: number) => {
  const [deleted] = await db
    .delete(collection)
    .where(eq(collection.id, id))
    .returning({ id: collection.id });
  if (!deleted) {
    throw new Error(`Collection ${id} not found.`);
  }
  return { deleted: true as const };
};

export const listCollectionFieldRecords = async (
  collectionId: number,
): Promise<CollectionFieldRow[]> => {
  return db
    .select()
    .from(collectionField)
    .where(eq(collectionField.collectionId, collectionId))
    .orderBy(asc(collectionField.position), asc(collectionField.id));
};

export const getCollectionFieldRecord = async (
  collectionId: number,
  fieldId: number,
): Promise<CollectionFieldRow | null> => {
  const [row] = await db
    .select()
    .from(collectionField)
    .where(
      and(
        eq(collectionField.id, fieldId),
        eq(collectionField.collectionId, collectionId),
      ),
    );
  return row ?? null;
};

export const addCollectionFieldRecord = async (
  collectionId: number,
  input: {
    key: string;
    label: string;
    fieldType: CollectionFieldType;
    required?: boolean;
  },
): Promise<CollectionFieldRow> => {
  const existing = await db
    .select({ value: count() })
    .from(collectionField)
    .where(eq(collectionField.collectionId, collectionId));
  const position = existing[0]?.value ?? 0;

  const [created] = await db
    .insert(collectionField)
    .values({
      collectionId,
      key: input.key,
      label: input.label,
      fieldType: input.fieldType,
      position,
      required: input.required ?? false,
      updatedAt: new Date(),
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create collection field.");
  }

  return created;
};

export const updateCollectionFieldRecord = async (
  collectionId: number,
  fieldId: number,
  input: {
    key: string;
    label: string;
    fieldType: CollectionFieldType;
    required?: boolean;
  },
): Promise<CollectionFieldRow> => {
  const [updated] = await db
    .update(collectionField)
    .set({
      key: input.key,
      label: input.label,
      fieldType: input.fieldType,
      required: input.required ?? false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(collectionField.id, fieldId),
        eq(collectionField.collectionId, collectionId),
      ),
    )
    .returning();

  if (!updated) {
    throw new Error(`Collection field ${fieldId} not found.`);
  }

  return updated;
};

export const deleteCollectionFieldRecord = async (
  collectionId: number,
  fieldId: number,
) => {
  const [deleted] = await db
    .delete(collectionField)
    .where(
      and(
        eq(collectionField.id, fieldId),
        eq(collectionField.collectionId, collectionId),
      ),
    )
    .returning({ id: collectionField.id });
  if (!deleted) {
    throw new Error(`Collection field ${fieldId} not found.`);
  }
  return { deleted: true as const };
};
