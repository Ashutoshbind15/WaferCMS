import { count, desc, eq } from "drizzle-orm";
import db from "./db";
import {
  type ListPageQuery,
  type PaginatedRows,
  paginateRows,
} from "./pagination";
import { fileMetadata } from "./schema";

export type FileMetadataRow = typeof fileMetadata.$inferSelect;

export const insertFileMetadata = async (row: {
  objectKey: string;
  originalFilename: string;
  contentType: string | null;
  byteLength: number;
  isPublic?: boolean;
}): Promise<void> => {
  await db.insert(fileMetadata).values({
    objectKey: row.objectKey,
    originalFilename: row.originalFilename,
    contentType: row.contentType,
    byteLength: row.byteLength,
    isPublic: row.isPublic ?? true,
  });
};

export const getFileMetadataById = async (
  id: number,
): Promise<FileMetadataRow | null> => {
  const [row] = await db
    .select()
    .from(fileMetadata)
    .where(eq(fileMetadata.id, id));
  return row ?? null;
};

export const updateFileMetadata = async (
  id: number,
  patch: { isPublic: boolean },
): Promise<void> => {
  const [updated] = await db
    .update(fileMetadata)
    .set({ isPublic: patch.isPublic })
    .where(eq(fileMetadata.id, id))
    .returning({ id: fileMetadata.id });

  if (!updated) {
    throw new Error(`File ${id} not found.`);
  }
};

export const listFileMetadata = async (
  query: ListPageQuery,
): Promise<PaginatedRows<FileMetadataRow>> => {
  return paginateRows({
    query,
    fetchPage: (limit, offset) =>
      db
        .select()
        .from(fileMetadata)
        .orderBy(desc(fileMetadata.createdAt), desc(fileMetadata.id))
        .limit(limit)
        .offset(offset),
    fetchTotal: async () => {
      const [row] = await db.select({ value: count() }).from(fileMetadata);
      return row?.value ?? 0;
    },
  });
};
