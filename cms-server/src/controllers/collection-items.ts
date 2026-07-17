import type { Request, Response } from "express";
import db from "@packages/cms-db/db";
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
  type CollectionDataFilter,
  type CollectionDataRow,
} from "@packages/cms-db/collection-data";
import {
  getCollectionRecord,
  listCollectionFieldRecords,
  type CollectionFieldRow,
} from "@packages/cms-db/collections";
import {
  type ListPageQuery,
  type PaginatedRows,
  paginateRows,
} from "@packages/cms-db/pagination";
import { parseListQuery } from "../lib/pagination.js";
import { parseIdParam, sendCreatedId, sendNoContent } from "../lib/http.js";
import {
  isItemValidationError,
  validateItemValues,
} from "../lib/item-values.js";
import type { CollectionItemBody } from "../lib/validation.js";

export type CollectionItem = {
  id: number;
  collectionId: number;
  draft: boolean;
  values: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

const assembleItem = (
  row: CollectionDataRow,
  fields: CollectionFieldRow[],
  valueRows: { dataId: number; fieldKey: string; value: unknown }[],
): CollectionItem => {
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

const parseCollectionId = (req: Request) =>
  parseIdParam(String(req.params.collectionId));

/** Drafts are excluded unless `includeDrafts=true` (or `1`) is passed. */
const parseIncludeDrafts = (req: Request): boolean => {
  const value = req.query.includeDrafts;
  return value === "true" || value === "1";
};

const listItemsData = async (
  collectionId: number,
  query: ListPageQuery,
  filter: CollectionDataFilter,
): Promise<PaginatedRows<CollectionItem>> => {
  const page = await paginateRows({
    query,
    fetchPage: (limit, offset) =>
      selectCollectionDataPage(collectionId, limit, offset, filter),
    fetchTotal: () => countCollectionData(collectionId, filter),
  });

  if (page.data.length === 0) {
    return { data: [], pagination: page.pagination };
  }

  const [fields, valueRows] = await Promise.all([
    listCollectionFieldRecords(collectionId),
    selectCollectionDataValuesForIds(page.data.map((row) => row.id)),
  ]);

  const valuesByDataId = new Map<
    number,
    { dataId: number; fieldKey: string; value: unknown }[]
  >();
  for (const valueRow of valueRows) {
    const list = valuesByDataId.get(valueRow.dataId);
    if (list) {
      list.push(valueRow);
    } else {
      valuesByDataId.set(valueRow.dataId, [valueRow]);
    }
  }

  const data = page.data.map((row) =>
    assembleItem(row, fields, valuesByDataId.get(row.id) ?? []),
  );

  return { data, pagination: page.pagination };
};

const getItemData = async (
  collectionId: number,
  dataId: number,
  filter: CollectionDataFilter,
): Promise<CollectionItem | null> => {
  const row = await selectCollectionDataById(collectionId, dataId, filter);
  if (!row) {
    return null;
  }

  const [fields, valueRows] = await Promise.all([
    listCollectionFieldRecords(collectionId),
    selectCollectionDataValuesForIds([row.id]),
  ]);

  return assembleItem(row, fields, valueRows);
};

const createItemData = async (
  collectionId: number,
  input: { values: Record<string, unknown>; draft: boolean },
): Promise<{ id: number }> => {
  const fields = await listCollectionFieldRecords(collectionId);
  const validated = await validateItemValues(fields, input);

  return db.transaction(async (tx) => {
    const data = await insertCollectionData(
      collectionId,
      { draft: input.draft },
      tx,
    );
    const valueRows = validated.map((v) => ({
      dataId: data.id,
      fieldId: v.fieldId,
      value: v.value,
    }));
    if (valueRows.length > 0) {
      await insertCollectionDataValues(valueRows, tx);
    }
    return { id: data.id };
  });
};

const updateItemData = async (
  collectionId: number,
  dataId: number,
  input: { values: Record<string, unknown>; draft: boolean },
): Promise<void> => {
  // Writes always resolve drafts so they can be edited/published.
  const existing = await selectCollectionDataById(collectionId, dataId, {
    includeDrafts: true,
  });
  if (!existing) {
    throw new Error(`Collection item ${dataId} not found.`);
  }

  const fields = await listCollectionFieldRecords(collectionId);
  const validated = await validateItemValues(fields, input);

  await db.transaction(async (tx) => {
    await updateCollectionData(
      collectionId,
      dataId,
      { draft: input.draft },
      tx,
    );
    const valueRows = validated.map((v) => ({
      dataId,
      fieldId: v.fieldId,
      value: v.value,
    }));
    if (valueRows.length > 0) {
      await upsertCollectionDataValues(valueRows, tx);
    }
  });
};

const deleteItemData = async (
  collectionId: number,
  dataId: number,
): Promise<void> => {
  await deleteCollectionData(collectionId, dataId);
};

export const listItems = async (req: Request, res: Response) => {
  const collectionId = parseCollectionId(req);
  if (collectionId === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  const collection = await getCollectionRecord(collectionId);
  if (!collection) {
    res
      .status(404)
      .json({ error: `Collection ${req.params.collectionId} not found.` });
    return;
  }

  let query: ListPageQuery;
  try {
    query = parseListQuery(req.query);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    res.status(400).json({ error: message });
    return;
  }

  const filter: CollectionDataFilter = {
    includeDrafts: parseIncludeDrafts(req),
  };

  try {
    const result = await listItemsData(collectionId, query, filter);
    res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    res.status(500).json({ error: message });
  }
};

export const getItem = async (req: Request, res: Response) => {
  const collectionId = parseCollectionId(req);
  if (collectionId === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  const itemId = parseIdParam(String(req.params.itemId));
  if (itemId === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  const collection = await getCollectionRecord(collectionId);
  if (!collection) {
    res
      .status(404)
      .json({ error: `Collection ${req.params.collectionId} not found.` });
    return;
  }

  const filter: CollectionDataFilter = {
    includeDrafts: parseIncludeDrafts(req),
  };

  const result = await getItemData(collectionId, itemId, filter);
  if (!result) {
    res
      .status(404)
      .json({ error: `Collection item ${req.params.itemId} not found.` });
    return;
  }
  res.json(result);
};

export const createItem = async (req: Request, res: Response) => {
  const collectionId = parseCollectionId(req);
  if (collectionId === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  const collection = await getCollectionRecord(collectionId);
  if (!collection) {
    res
      .status(404)
      .json({ error: `Collection ${req.params.collectionId} not found.` });
    return;
  }

  const { values, draft } = req.body as CollectionItemBody;
  try {
    const result = await createItemData(collectionId, { values, draft });
    sendCreatedId(res, result.id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    if (isItemValidationError(message)) {
      res.status(400).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  const collectionId = parseCollectionId(req);
  if (collectionId === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  const itemId = parseIdParam(String(req.params.itemId));
  if (itemId === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  const collection = await getCollectionRecord(collectionId);
  if (!collection) {
    res
      .status(404)
      .json({ error: `Collection ${req.params.collectionId} not found.` });
    return;
  }

  const { values, draft } = req.body as CollectionItemBody;
  try {
    await updateItemData(collectionId, itemId, { values, draft });
    sendNoContent(res);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    if (isItemValidationError(message)) {
      res.status(400).json({ error: message });
      return;
    }
    if (message.endsWith("not found.")) {
      res.status(404).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  const collectionId = parseCollectionId(req);
  if (collectionId === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  const itemId = parseIdParam(String(req.params.itemId));
  if (itemId === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  const collection = await getCollectionRecord(collectionId);
  if (!collection) {
    res
      .status(404)
      .json({ error: `Collection ${req.params.collectionId} not found.` });
    return;
  }

  try {
    await deleteItemData(collectionId, itemId);
    sendNoContent(res);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    if (message.endsWith("not found.")) {
      res.status(404).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
};
