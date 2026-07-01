import { desc, eq } from "drizzle-orm";
import db from "./db";
import { blogContent, blogDiagram, fileMetadata } from "./schema";

type ContentRow = typeof blogContent.$inferSelect;
type DiagramRow = typeof blogDiagram.$inferSelect;
type FileMetadataRow = typeof fileMetadata.$inferSelect;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const listContentRecords = async (): Promise<ContentRow[]> => {
  return db
    .select()
    .from(blogContent)
    .orderBy(desc(blogContent.updatedAt), desc(blogContent.id));
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
  if (!isNonEmptyString(title)) {
    throw new Error("Title is required.");
  }

  const [created] = await db
    .insert(blogContent)
    .values({
      title: title.trim(),
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
  if (!isNonEmptyString(title)) {
    throw new Error("Title is required.");
  }

  const [updated] = await db
    .update(blogContent)
    .set({
      title: title.trim(),
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

export const listDiagramRecords = async (): Promise<DiagramRow[]> => {
  return db
    .select()
    .from(blogDiagram)
    .orderBy(desc(blogDiagram.updatedAt), desc(blogDiagram.id));
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
  if (!isNonEmptyString(title)) {
    throw new Error("Title is required.");
  }

  const [created] = await db
    .insert(blogDiagram)
    .values({
      title: title.trim(),
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
  if (!isNonEmptyString(title)) {
    throw new Error("Title is required.");
  }

  const [updated] = await db
    .update(blogDiagram)
    .set({
      title: title.trim(),
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
  publicUrl: string;
  originalFilename: string;
  contentType: string | null;
  byteLength: number;
}): Promise<FileMetadataRow> => {
  const [rowOut] = await db
    .insert(fileMetadata)
    .values({
      objectKey: row.objectKey,
      publicUrl: row.publicUrl,
      originalFilename: row.originalFilename,
      contentType: row.contentType,
      byteLength: row.byteLength,
    })
    .returning();

  if (!rowOut) {
    throw new Error("Failed to create file metadata.");
  }

  return rowOut;
};

export const listFileMetadata = async (): Promise<FileMetadataRow[]> => {
  return db.select().from(fileMetadata).orderBy(desc(fileMetadata.createdAt));
};
