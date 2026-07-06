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
  collectionFieldTypeValues,
  type CollectionFieldType,
} from "./schema";

type CollectionRow = typeof collection.$inferSelect;
type CollectionFieldRow = typeof collectionField.$inferSelect;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const slugPattern = /^[a-z][a-z0-9-]*$/;

const normalizeSlug = (value: string) => value.trim().toLowerCase();

const normalizeFieldKey = (value: string) => value.trim().toLowerCase();

const assertValidSlug = (slug: string) => {
  if (!slugPattern.test(slug)) {
    throw new Error(
      "Slug must start with a letter and contain only lowercase letters, numbers, and hyphens.",
    );
  }
};

const assertValidFieldKey = (key: string) => {
  if (!slugPattern.test(key)) {
    throw new Error(
      "Field key must start with a letter and contain only lowercase letters, numbers, and hyphens.",
    );
  }
};

const assertValidFieldType = (fieldType: string): CollectionFieldType => {
  if (
    !(collectionFieldTypeValues as readonly string[]).includes(fieldType)
  ) {
    throw new Error(
      `Field type must be one of: ${collectionFieldTypeValues.join(", ")}.`,
    );
  }
  return fieldType as CollectionFieldType;
};

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
  if (!isNonEmptyString(input.title)) {
    throw new Error("Title is required.");
  }
  if (!isNonEmptyString(input.slug)) {
    throw new Error("Slug is required.");
  }

  const slug = normalizeSlug(input.slug);
  assertValidSlug(slug);

  const [created] = await db
    .insert(collection)
    .values({
      slug,
      title: input.title.trim(),
      description: input.description?.trim() || null,
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
  if (!isNonEmptyString(input.title)) {
    throw new Error("Title is required.");
  }
  if (!isNonEmptyString(input.slug)) {
    throw new Error("Slug is required.");
  }

  const slug = normalizeSlug(input.slug);
  assertValidSlug(slug);

  const [updated] = await db
    .update(collection)
    .set({
      slug,
      title: input.title.trim(),
      description: input.description?.trim() || null,
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
  await assertCollectionExists(collectionId);

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
    fieldType: string;
    required?: boolean;
  },
): Promise<CollectionFieldRow> => {
  await assertCollectionExists(collectionId);

  if (!isNonEmptyString(input.key)) {
    throw new Error("Field key is required.");
  }
  if (!isNonEmptyString(input.label)) {
    throw new Error("Field label is required.");
  }

  const key = normalizeFieldKey(input.key);
  assertValidFieldKey(key);
  const fieldType = assertValidFieldType(input.fieldType);

  const existing = await db
    .select({ value: count() })
    .from(collectionField)
    .where(eq(collectionField.collectionId, collectionId));
  const position = existing[0]?.value ?? 0;

  const [created] = await db
    .insert(collectionField)
    .values({
      collectionId,
      key,
      label: input.label.trim(),
      fieldType,
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
    fieldType: string;
    required?: boolean;
  },
): Promise<CollectionFieldRow> => {
  if (!isNonEmptyString(input.key)) {
    throw new Error("Field key is required.");
  }
  if (!isNonEmptyString(input.label)) {
    throw new Error("Field label is required.");
  }

  const key = normalizeFieldKey(input.key);
  assertValidFieldKey(key);
  const fieldType = assertValidFieldType(input.fieldType);

  const [updated] = await db
    .update(collectionField)
    .set({
      key,
      label: input.label.trim(),
      fieldType,
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

const assertCollectionExists = async (collectionId: number) => {
  const existing = await getCollectionRecord(collectionId);
  if (!existing) {
    throw new Error(`Collection ${collectionId} not found.`);
  }
};
