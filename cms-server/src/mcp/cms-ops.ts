import { randomUUID } from "node:crypto";
import {
  getFileMetadataById,
  insertFileMetadata,
  listFileMetadata,
  updateFileMetadata,
} from "@packages/cms-db/access";
import {
  countCollectionData,
  deleteCollectionData,
  insertCollectionData,
  insertCollectionDataValues,
  selectCollectionDataById,
  selectCollectionDataPage,
  selectCollectionDataValuesForIds,
  updateCollectionData,
  upsertCollectionDataValues,
} from "@packages/cms-db/collection-data";
import {
  addCollectionFieldRecord,
  addCollectionRecord,
  countCollectionFieldRecords,
  deleteCollectionFieldRecord,
  deleteCollectionRecord,
  getCollectionFieldRecord,
  getCollectionRecord,
  getCollectionRecordBySlug,
  listCollectionFieldRecords,
  listCollectionRecords,
  updateCollectionFieldRecord,
  updateCollectionRecord,
} from "@packages/cms-db/collections";
import db from "@packages/cms-db/db";
import {
  paginateRows,
  type ListPageQuery,
} from "@packages/cms-db/pagination";
import { putObject } from "@packages/storage/lib";
import { generateItemDraft } from "../lib/ai/draft-item.js";
import { isAiDraftsEnabled } from "../lib/ai/features.js";
import { cmsPublicBaseUrl } from "../lib/asset-url.js";
import { toFileResponse } from "../lib/files.js";
import {
  isItemValidationError,
  validateItemValues,
} from "../lib/item-values.js";
import {
  collectionBodySchema,
  collectionFieldBodySchema,
  collectionItemBodySchema,
} from "../lib/validation.js";
import { McpToolError } from "./errors.js";

const pageQuery = (page?: number, limit?: number): ListPageQuery => ({
  page: page ?? 1,
  limit: limit ?? 20,
  includeCount: true,
});

export const mcpListCollections = async (page?: number, limit?: number) =>
  listCollectionRecords(pageQuery(page, limit));

export const mcpGetCollection = async (input: {
  id?: number;
  slug?: string;
}) => {
  if (input.id != null) {
    const row = await getCollectionRecord(input.id);
    if (!row) throw new McpToolError(`Collection ${input.id} not found.`, "not_found");
    return row;
  }
  if (input.slug) {
    const row = await getCollectionRecordBySlug(input.slug);
    if (!row) {
      throw new McpToolError(`Collection "${input.slug}" not found.`, "not_found");
    }
    return row;
  }
  throw new McpToolError("Provide id or slug.", "invalid_argument");
};

export const mcpCreateCollection = async (input: unknown) => {
  const body = collectionBodySchema.parse(input);
  return addCollectionRecord(body);
};

export const mcpUpdateCollection = async (id: number, input: unknown) => {
  const existing = await getCollectionRecord(id);
  if (!existing) throw new McpToolError(`Collection ${id} not found.`, "not_found");
  const body = collectionBodySchema.parse(input);
  await updateCollectionRecord(id, body);
  return getCollectionRecord(id);
};

export const mcpDeleteCollection = async (id: number) => {
  const existing = await getCollectionRecord(id);
  if (!existing) throw new McpToolError(`Collection ${id} not found.`, "not_found");
  await deleteCollectionRecord(id);
  return { deleted: true, id };
};

export const mcpListFields = async (collectionId: number) => {
  await requireCollection(collectionId);
  return { data: await listCollectionFieldRecords(collectionId) };
};

export const mcpGetField = async (collectionId: number, fieldId: number) => {
  await requireCollection(collectionId);
  const field = await getCollectionFieldRecord(collectionId, fieldId);
  if (!field) {
    throw new McpToolError(`Field ${fieldId} not found.`, "not_found");
  }
  return field;
};

export const mcpCreateField = async (collectionId: number, input: unknown) => {
  await requireCollection(collectionId);
  const body = collectionFieldBodySchema.parse(input);
  const position = await countCollectionFieldRecords(collectionId);
  await addCollectionFieldRecord(collectionId, { ...body, position });
  return { created: true, collectionId, key: body.key };
};

export const mcpUpdateField = async (
  collectionId: number,
  fieldId: number,
  input: unknown,
) => {
  await requireCollection(collectionId);
  const existing = await getCollectionFieldRecord(collectionId, fieldId);
  if (!existing) throw new McpToolError(`Field ${fieldId} not found.`, "not_found");
  const body = collectionFieldBodySchema.parse(input);
  await updateCollectionFieldRecord(collectionId, fieldId, body);
  return getCollectionFieldRecord(collectionId, fieldId);
};

export const mcpDeleteField = async (collectionId: number, fieldId: number) => {
  await requireCollection(collectionId);
  const existing = await getCollectionFieldRecord(collectionId, fieldId);
  if (!existing) throw new McpToolError(`Field ${fieldId} not found.`, "not_found");
  await deleteCollectionFieldRecord(collectionId, fieldId);
  return { deleted: true, id: fieldId };
};

export const mcpListItems = async (input: {
  collectionId: number;
  page?: number;
  limit?: number;
  includeDrafts?: boolean;
}) => {
  await requireCollection(input.collectionId);
  const filter = { includeDrafts: input.includeDrafts === true };
  const query = pageQuery(input.page, input.limit);
  const page = await paginateRows({
    query,
    fetchPage: (limit, offset) =>
      selectCollectionDataPage(input.collectionId, limit, offset, filter),
    fetchTotal: () => countCollectionData(input.collectionId, filter),
  });
  if (page.data.length === 0) {
    return { data: [], pagination: page.pagination };
  }
  const [fields, valueRows] = await Promise.all([
    listCollectionFieldRecords(input.collectionId),
    selectCollectionDataValuesForIds(page.data.map((row) => row.id)),
  ]);
  const byDataId = new Map<number, { fieldKey: string; value: unknown }[]>();
  for (const row of valueRows) {
    const list = byDataId.get(row.dataId) ?? [];
    list.push({ fieldKey: row.fieldKey, value: row.value });
    byDataId.set(row.dataId, list);
  }
  return {
    data: page.data.map((row) => {
      const values: Record<string, unknown> = {};
      const valueList = byDataId.get(row.id) ?? [];
      const byKey = new Map(valueList.map((v) => [v.fieldKey, v.value]));
      for (const field of fields) {
        values[field.key] = byKey.has(field.key) ? byKey.get(field.key) : null;
      }
      return {
        id: row.id,
        collectionId: row.collectionId,
        draft: row.draft,
        values,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    }),
    pagination: page.pagination,
  };
};

export const mcpGetItem = async (input: {
  collectionId: number;
  itemId: number;
  includeDrafts?: boolean;
}) => {
  await requireCollection(input.collectionId);
  const row = await selectCollectionDataById(
    input.collectionId,
    input.itemId,
    { includeDrafts: input.includeDrafts === true },
  );
  if (!row) {
    throw new McpToolError(`Item ${input.itemId} not found.`, "not_found");
  }
  const [fields, valueRows] = await Promise.all([
    listCollectionFieldRecords(input.collectionId),
    selectCollectionDataValuesForIds([row.id]),
  ]);
  const byKey = new Map(valueRows.map((v) => [v.fieldKey, v.value]));
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    values[field.key] = byKey.has(field.key) ? byKey.get(field.key) : null;
  }
  return {
    id: row.id,
    collectionId: row.collectionId,
    draft: row.draft,
    values,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

export const mcpCreateItem = async (
  collectionId: number,
  input: unknown,
) => {
  await requireCollection(collectionId);
  const body = collectionItemBodySchema.parse(input);
  try {
    const fields = await listCollectionFieldRecords(collectionId);
    const validated = await validateItemValues(fields, body);
    return db.transaction(async (tx) => {
      const data = await insertCollectionData(
        collectionId,
        { draft: body.draft },
        tx,
      );
      if (validated.length > 0) {
        await insertCollectionDataValues(
          validated.map((v) => ({
            dataId: data.id,
            fieldId: v.fieldId,
            value: v.value,
          })),
          tx,
        );
      }
      return { id: data.id };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isItemValidationError(message)) {
      throw new McpToolError(message, "invalid_argument");
    }
    throw error;
  }
};

export const mcpUpdateItem = async (
  collectionId: number,
  itemId: number,
  input: unknown,
) => {
  await requireCollection(collectionId);
  const body = collectionItemBodySchema.parse(input);
  const existing = await selectCollectionDataById(collectionId, itemId, {
    includeDrafts: true,
  });
  if (!existing) {
    throw new McpToolError(`Item ${itemId} not found.`, "not_found");
  }
  try {
    const fields = await listCollectionFieldRecords(collectionId);
    const validated = await validateItemValues(fields, body);
    await db.transaction(async (tx) => {
      await updateCollectionData(
        collectionId,
        itemId,
        { draft: body.draft },
        tx,
      );
      if (validated.length > 0) {
        await upsertCollectionDataValues(
          validated.map((v) => ({
            dataId: itemId,
            fieldId: v.fieldId,
            value: v.value,
          })),
          tx,
        );
      }
    });
    return mcpGetItem({ collectionId, itemId, includeDrafts: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isItemValidationError(message)) {
      throw new McpToolError(message, "invalid_argument");
    }
    throw error;
  }
};

export const mcpDeleteItem = async (collectionId: number, itemId: number) => {
  await requireCollection(collectionId);
  const existing = await selectCollectionDataById(collectionId, itemId, {
    includeDrafts: true,
  });
  if (!existing) {
    throw new McpToolError(`Item ${itemId} not found.`, "not_found");
  }
  await deleteCollectionData(collectionId, itemId);
  return { deleted: true, id: itemId };
};

export const mcpListFiles = async (page?: number, limit?: number) => {
  const result = await listFileMetadata(pageQuery(page, limit));
  const baseUrl = cmsPublicBaseUrl();
  return {
    data: result.data.map((row) => toFileResponse(row, baseUrl)),
    pagination: result.pagination,
  };
};

export const mcpGetFileMeta = async (id: number) => {
  const row = await getFileMetadataById(id);
  if (!row) throw new McpToolError(`File ${id} not found.`, "not_found");
  return toFileResponse(row, cmsPublicBaseUrl());
};

export const mcpUploadFile = async (input: {
  filename: string;
  contentBase64: string;
  contentType?: string;
  isPublic?: boolean;
}) => {
  const filename = input.filename.trim() || "file";
  let buffer: Buffer;
  try {
    buffer = Buffer.from(input.contentBase64, "base64");
  } catch {
    throw new McpToolError("contentBase64 is not valid base64.", "invalid_argument");
  }
  if (buffer.length === 0) {
    throw new McpToolError("File content is empty.", "invalid_argument");
  }
  const objectKey = `${randomUUID()}-${filename.replace(/[^\w.\-]+/g, "_")}`;
  const contentType = input.contentType?.trim() || null;
  await putObject({
    key: objectKey,
    body: buffer,
    contentType: contentType ?? undefined,
  });
  const row = await insertFileMetadata({
    objectKey,
    originalFilename: filename,
    contentType,
    byteLength: buffer.length,
    isPublic: input.isPublic !== false,
  });
  return toFileResponse(row, cmsPublicBaseUrl());
};

export const mcpPatchFile = async (id: number, isPublic: boolean) => {
  const row = await getFileMetadataById(id);
  if (!row) throw new McpToolError(`File ${id} not found.`, "not_found");
  await updateFileMetadata(id, { isPublic });
  return mcpGetFileMeta(id);
};

export const mcpAiDraft = async (input: {
  collectionId: number;
  prompt: string;
  model?: string;
}) => {
  if (!isAiDraftsEnabled()) {
    throw new McpToolError(
      "AI drafts are disabled. Set CMS_AI_DRAFTS_ENABLED=true.",
      "forbidden",
    );
  }
  const collection = await requireCollection(input.collectionId);
  const fields = await listCollectionFieldRecords(input.collectionId);
  if (fields.length === 0) {
    throw new McpToolError("This collection has no fields defined.", "invalid_argument");
  }
  try {
    return await generateItemDraft({
      collection: {
        title: collection.title,
        description: collection.description,
      },
      fields,
      prompt: input.prompt,
      model: input.model,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("no AI-generatable fields") ||
      isItemValidationError(message)
    ) {
      throw new McpToolError(message, "invalid_argument");
    }
    throw new McpToolError(message, "failed");
  }
};

const requireCollection = async (collectionId: number) => {
  const collection = await getCollectionRecord(collectionId);
  if (!collection) {
    throw new McpToolError(`Collection ${collectionId} not found.`, "not_found");
  }
  return collection;
};
