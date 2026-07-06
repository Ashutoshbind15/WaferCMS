import { count, desc, eq } from "drizzle-orm";
import db from "./db";
import {
  type ListPageQuery,
  type PaginatedRows,
  paginateRows,
} from "./pagination";
import { blogContent, blogDiagram, fileMetadata } from "./schema";

type ContentRow = typeof blogContent.$inferSelect;
type DiagramRow = typeof blogDiagram.$inferSelect;
export type FileMetadataRow = typeof fileMetadata.$inferSelect;

export const listContentRecords = async (
  query: ListPageQuery,
): Promise<PaginatedRows<ContentRow>> => {
  return paginateRows({
    query,
    fetchPage: (limit, offset) =>
      db
        .select()
        .from(blogContent)
        .orderBy(desc(blogContent.updatedAt), desc(blogContent.id))
        .limit(limit)
        .offset(offset),
    fetchTotal: async () => {
      const [row] = await db.select({ value: count() }).from(blogContent);
      return row?.value ?? 0;
    },
  });
};

export const getContentRecord = async (
  id: number,
): Promise<ContentRow | null> => {
  const [row] = await db
    .select()
    .from(blogContent)
    .where(eq(blogContent.id, id));
  return row ?? null;
};

export const addContentRecord = async (
  title: string,
  payload: unknown,
): Promise<ContentRow> => {
  const [created] = await db
    .insert(blogContent)
    .values({
      title,
      payload,
      updatedAt: new Date(),
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create content.");
  }

  return created;
};

export const updateContentRecord = async (
  id: number,
  title: string,
  payload: unknown,
): Promise<ContentRow> => {
  const [updated] = await db
    .update(blogContent)
    .set({
      title,
      payload,
      updatedAt: new Date(),
    })
    .where(eq(blogContent.id, id))
    .returning();

  if (!updated) {
    throw new Error(`Content ${id} not found.`);
  }

  return updated;
};

export const deleteContentRecord = async (id: number) => {
  const [deleted] = await db
    .delete(blogContent)
    .where(eq(blogContent.id, id))
    .returning({ id: blogContent.id });
  if (!deleted) {
    throw new Error(`Content ${id} not found.`);
  }
  return { deleted: true };
};

export const listDiagramRecords = async (
  query: ListPageQuery,
): Promise<PaginatedRows<DiagramRow>> => {
  return paginateRows({
    query,
    fetchPage: (limit, offset) =>
      db
        .select()
        .from(blogDiagram)
        .orderBy(desc(blogDiagram.updatedAt), desc(blogDiagram.id))
        .limit(limit)
        .offset(offset),
    fetchTotal: async () => {
      const [row] = await db.select({ value: count() }).from(blogDiagram);
      return row?.value ?? 0;
    },
  });
};

export const getDiagramRecord = async (
  id: number,
): Promise<DiagramRow | null> => {
  const [row] = await db
    .select()
    .from(blogDiagram)
    .where(eq(blogDiagram.id, id));
  return row ?? null;
};

export const addDiagramRecord = async (
  title: string,
  payload: unknown,
): Promise<DiagramRow> => {
  const [created] = await db
    .insert(blogDiagram)
    .values({
      title,
      payload,
      updatedAt: new Date(),
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create diagram.");
  }

  return created;
};

export const updateDiagramRecord = async (
  id: number,
  title: string,
  payload: unknown,
): Promise<DiagramRow> => {
  const [updated] = await db
    .update(blogDiagram)
    .set({
      title,
      payload,
      updatedAt: new Date(),
    })
    .where(eq(blogDiagram.id, id))
    .returning();

  if (!updated) {
    throw new Error(`Diagram ${id} not found.`);
  }

  return updated;
};

export const deleteDiagramRecord = async (id: number) => {
  const [deleted] = await db
    .delete(blogDiagram)
    .where(eq(blogDiagram.id, id))
    .returning({ id: blogDiagram.id });
  if (!deleted) {
    throw new Error(`Diagram ${id} not found.`);
  }
  return { deleted: true };
};

export const insertFileMetadata = async (row: {
  objectKey: string;
  originalFilename: string;
  contentType: string | null;
  byteLength: number;
  isPublic?: boolean;
}): Promise<FileMetadataRow> => {
  const [rowOut] = await db
    .insert(fileMetadata)
    .values({
      objectKey: row.objectKey,
      originalFilename: row.originalFilename,
      contentType: row.contentType,
      byteLength: row.byteLength,
      isPublic: row.isPublic ?? true,
    })
    .returning();

  if (!rowOut) {
    throw new Error("Failed to create file metadata.");
  }

  return rowOut;
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
): Promise<FileMetadataRow> => {
  const [updated] = await db
    .update(fileMetadata)
    .set({ isPublic: patch.isPublic })
    .where(eq(fileMetadata.id, id))
    .returning();

  if (!updated) {
    throw new Error(`File ${id} not found.`);
  }

  return updated;
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
