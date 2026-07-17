import { count } from "drizzle-orm";
import {
  insertCollectionData,
  insertCollectionDataValues,
} from "./collection-data.js";
import {
  addCollectionFieldRecord,
  addCollectionRecord,
  listCollectionFieldRecords,
} from "./collections.js";
import db from "./db.js";
import {
  collection,
  fileMetadata,
  type CollectionFieldType,
} from "./schema.js";

export const seedDemoCountCollections = async (): Promise<number> => {
  const [row] = await db.select({ value: count() }).from(collection);
  return row?.value ?? 0;
};

export const seedDemoClearCollections = async (): Promise<void> => {
  await db.delete(collection);
};

export const seedDemoClearFileMetadata = async (): Promise<void> => {
  await db.delete(fileMetadata);
};

export const seedDemoInsertFileMetadata = async (row: {
  objectKey: string;
  originalFilename: string;
  contentType: string | null;
  byteLength: number;
  isPublic?: boolean;
}): Promise<{ id: number }> => {
  const [created] = await db
    .insert(fileMetadata)
    .values({
      objectKey: row.objectKey,
      originalFilename: row.originalFilename,
      contentType: row.contentType,
      byteLength: row.byteLength,
      isPublic: row.isPublic ?? true,
    })
    .returning({ id: fileMetadata.id });

  if (!created) {
    throw new Error("Failed to insert file metadata.");
  }

  return created;
};

export const seedDemoAddCollection = async (input: {
  slug: string;
  title: string;
  description?: string | null;
}): Promise<{ id: number }> => addCollectionRecord(input);

export const seedDemoAddCollectionField = async (
  collectionId: number,
  input: {
    key: string;
    label: string;
    fieldType: CollectionFieldType;
    position: number;
    required?: boolean;
    isTitle?: boolean;
  },
): Promise<void> => addCollectionFieldRecord(collectionId, input);

export const seedDemoListCollectionFields = async (collectionId: number) =>
  listCollectionFieldRecords(collectionId);

export const seedDemoInsertCollectionItem = async (
  collectionId: number,
  fieldByKey: Map<string, number>,
  item: Record<string, unknown>,
): Promise<void> => {
  await db.transaction(async (tx) => {
    const { id: dataId } = await insertCollectionData(
      collectionId,
      { draft: false },
      tx,
    );
    const values = Object.entries(item)
      .map(([key, value]) => {
        const fieldId = fieldByKey.get(key);
        if (!fieldId) {
          return null;
        }
        return { dataId, fieldId, value };
      })
      .filter((row) => row !== null);

    await insertCollectionDataValues(values, tx);
  });
};
