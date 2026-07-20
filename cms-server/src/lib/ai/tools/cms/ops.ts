import {
  getFileMetadataById,
  listFileMetadata,
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
  getCollectionFieldRecord,
  getCollectionRecord,
  getCollectionRecordBySlug,
  listCollectionFieldRecords,
  listCollectionRecords,
} from "@packages/cms-db/collections";
import db from "@packages/cms-db/db";
import {
  paginateRows,
  type ListPageQuery,
} from "@packages/cms-db/pagination";
import { cmsPublicBaseUrl } from "../../../asset-url.js";
import { toFileResponse } from "../../../files.js";
import {
  isItemValidationError,
  validateItemValues,
} from "../../../item-values.js";
import { ZodError } from "zod";
import { collectionItemBodySchema } from "../../../validation.js";
import { CmsToolError } from "./errors.js";
import {
  presentCollection,
  presentField,
  presentFile,
  presentItem,
  presentPagination,
} from "./present.js";

const zodMessage = (error: ZodError): string =>
  error.issues.map((issue) => issue.message).join("; ") || "Invalid input.";

const pageQuery = (page?: number, limit?: number): ListPageQuery => ({
  page: page ?? 1,
  limit: limit ?? 20,
  includeCount: true,
});

const requireCollection = async (collectionId: number) => {
  const collection = await getCollectionRecord(collectionId);
  if (!collection) {
    throw new CmsToolError(
      `Collection ${collectionId} not found.`,
      "not_found",
    );
  }
  return collection;
};

export const listCollections = async (page?: number, limit?: number) => {
  const result = await listCollectionRecords(pageQuery(page, limit));
  return {
    data: result.data.map(presentCollection),
    pagination: presentPagination(result.pagination),
  };
};

export const getCollection = async (input: {
  id?: number;
  slug?: string;
}) => {
  if (input.id != null) {
    const row = await getCollectionRecord(input.id);
    if (!row) {
      throw new CmsToolError(`Collection ${input.id} not found.`, "not_found");
    }
    return presentCollection(row);
  }
  if (input.slug) {
    const row = await getCollectionRecordBySlug(input.slug);
    if (!row) {
      throw new CmsToolError(
        `Collection "${input.slug}" not found.`,
        "not_found",
      );
    }
    return presentCollection(row);
  }
  throw new CmsToolError("Provide id or slug.", "invalid_argument");
};

export const listFields = async (collectionId: number) => {
  await requireCollection(collectionId);
  const fields = await listCollectionFieldRecords(collectionId);
  return { data: fields.map(presentField) };
};

export const getField = async (collectionId: number, fieldId: number) => {
  await requireCollection(collectionId);
  const field = await getCollectionFieldRecord(collectionId, fieldId);
  if (!field) {
    throw new CmsToolError(`Field ${fieldId} not found.`, "not_found");
  }
  return presentField(field);
};

const loadItem = async (
  collectionId: number,
  itemId: number,
  includeDrafts: boolean,
) => {
  const row = await selectCollectionDataById(collectionId, itemId, {
    includeDrafts,
  });
  if (!row) {
    return null;
  }
  const [fields, valueRows] = await Promise.all([
    listCollectionFieldRecords(collectionId),
    selectCollectionDataValuesForIds([row.id]),
  ]);
  const byKey = new Map(valueRows.map((v) => [v.fieldKey, v.value]));
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    values[field.key] = byKey.has(field.key) ? byKey.get(field.key) : null;
  }
  return presentItem({
    id: row.id,
    collectionId: row.collectionId,
    draft: row.draft,
    values,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
};

export const listItems = async (input: {
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
    return { data: [], pagination: presentPagination(page.pagination) };
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
      return presentItem({
        id: row.id,
        collectionId: row.collectionId,
        draft: row.draft,
        values,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    }),
    pagination: presentPagination(page.pagination),
  };
};

export const getItem = async (input: {
  collectionId: number;
  itemId: number;
  includeDrafts?: boolean;
}) => {
  await requireCollection(input.collectionId);
  const item = await loadItem(
    input.collectionId,
    input.itemId,
    input.includeDrafts === true,
  );
  if (!item) {
    throw new CmsToolError(`Item ${input.itemId} not found.`, "not_found");
  }
  return item;
};

export const createItem = async (
  collectionId: number,
  input: unknown,
) => {
  await requireCollection(collectionId);
  let body;
  try {
    body = collectionItemBodySchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new CmsToolError(zodMessage(error), "invalid_argument");
    }
    throw error;
  }
  try {
    const fields = await listCollectionFieldRecords(collectionId);
    const validated = await validateItemValues(fields, body);
    const created = await db.transaction(async (tx) => {
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
      return data;
    });
    return getItem({
      collectionId,
      itemId: created.id,
      includeDrafts: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isItemValidationError(message)) {
      throw new CmsToolError(message, "invalid_argument");
    }
    throw error;
  }
};

export const updateItem = async (
  collectionId: number,
  itemId: number,
  input: {
    values: Record<string, unknown>;
    draft?: boolean;
  },
) => {
  await requireCollection(collectionId);
  const existing = await selectCollectionDataById(collectionId, itemId, {
    includeDrafts: true,
  });
  if (!existing) {
    throw new CmsToolError(`Item ${itemId} not found.`, "not_found");
  }
  const draft = input.draft ?? existing.draft;
  let body;
  try {
    body = collectionItemBodySchema.parse({
      values: input.values,
      draft,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new CmsToolError(zodMessage(error), "invalid_argument");
    }
    throw error;
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
    return getItem({ collectionId, itemId, includeDrafts: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isItemValidationError(message)) {
      throw new CmsToolError(message, "invalid_argument");
    }
    throw error;
  }
};

export const deleteItem = async (collectionId: number, itemId: number) => {
  await requireCollection(collectionId);
  const existing = await selectCollectionDataById(collectionId, itemId, {
    includeDrafts: true,
  });
  if (!existing) {
    throw new CmsToolError(`Item ${itemId} not found.`, "not_found");
  }
  await deleteCollectionData(collectionId, itemId);
  return { deleted: true as const, id: itemId, collectionId };
};

export const listFiles = async (page?: number, limit?: number) => {
  const result = await listFileMetadata(pageQuery(page, limit));
  const baseUrl = cmsPublicBaseUrl();
  return {
    data: result.data.map((row) => presentFile(toFileResponse(row, baseUrl))),
    pagination: presentPagination(result.pagination),
  };
};

export const getFileMeta = async (id: number) => {
  const row = await getFileMetadataById(id);
  if (!row) {
    throw new CmsToolError(`File ${id} not found.`, "not_found");
  }
  return presentFile(toFileResponse(row, cmsPublicBaseUrl()));
};
