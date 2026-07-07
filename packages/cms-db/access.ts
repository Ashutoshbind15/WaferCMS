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
): Promise<{ id: number }> => {
  const [created] = await db
    .insert(blogContent)
    .values({
      title,
      payload,
      updatedAt: new Date(),
    })
    .returning({ id: blogContent.id });

  if (!created) {
    throw new Error("Failed to create content.");
  }

  return created;
};

export const updateContentRecord = async (
  id: number,
  title: string,
  payload: unknown,
): Promise<void> => {
  const [updated] = await db
    .update(blogContent)
    .set({
      title,
      payload,
      updatedAt: new Date(),
    })
    .where(eq(blogContent.id, id))
    .returning({ id: blogContent.id });

  if (!updated) {
    throw new Error(`Content ${id} not found.`);
  }
};

export const deleteContentRecord = async (id: number): Promise<void> => {
  const [deleted] = await db
    .delete(blogContent)
    .where(eq(blogContent.id, id))
    .returning({ id: blogContent.id });
  if (!deleted) {
    throw new Error(`Content ${id} not found.`);
  }
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
): Promise<{ id: number }> => {
  const [created] = await db
    .insert(blogDiagram)
    .values({
      title,
      payload,
      updatedAt: new Date(),
    })
    .returning({ id: blogDiagram.id });

  if (!created) {
    throw new Error("Failed to create diagram.");
  }

  return created;
};

export const updateDiagramRecord = async (
  id: number,
  title: string,
  payload: unknown,
): Promise<void> => {
  const [updated] = await db
    .update(blogDiagram)
    .set({
      title,
      payload,
      updatedAt: new Date(),
    })
    .where(eq(blogDiagram.id, id))
    .returning({ id: blogDiagram.id });

  if (!updated) {
    throw new Error(`Diagram ${id} not found.`);
  }
};

export const deleteDiagramRecord = async (id: number): Promise<void> => {
  const [deleted] = await db
    .delete(blogDiagram)
    .where(eq(blogDiagram.id, id))
    .returning({ id: blogDiagram.id });
  if (!deleted) {
    throw new Error(`Diagram ${id} not found.`);
  }
};

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
