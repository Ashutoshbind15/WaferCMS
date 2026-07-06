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
  touchCollectionData,
  upsertCollectionDataValues,
  type CollectionDataValueInput,
  type CollectionDataRow,
} from "@packages/cms-db/collection-data";
import {
  getCollectionRecord,
  listCollectionFieldRecords,
  type CollectionFieldRow,
} from "@packages/cms-db/collections";
import { type CollectionFieldType } from "@packages/cms-db/schema";
import {
  type ListPageQuery,
  type PaginatedRows,
  paginateRows,
} from "@packages/cms-db/pagination";
import { parseListQuery } from "../lib/pagination";
import { parseIdParam, sendRouteError } from "../lib/http";
import type { CollectionItemBody } from "../lib/validation";

export type CollectionItem = {
  id: number;
  collectionId: number;
  values: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

type ValidatedValue = CollectionDataValueInput & { key: string };

const validateTextValue = (fieldKey: string, value: unknown): string => {
  if (typeof value !== "string") {
    throw new Error(
      `Item value for field "${fieldKey}" must be a string.`,
    );
  }
  return value;
};

const validateLongTextValue = (fieldKey: string, value: unknown): string => {
  if (typeof value !== "string") {
    throw new Error(
      `Item value for field "${fieldKey}" must be a string.`,
    );
  }
  return value;
};

// TODO: export a `RichTextContent` validator from the rich-text package and
// enforce the document shape here instead of accepting arbitrary JSON.
const validateRichtextValue = (_fieldKey: string, value: unknown): unknown =>
  value;

// TODO: export a `DiagramDocument` validator from the diagrams package and
// enforce the document shape here instead of accepting arbitrary JSON.
const validateDiagramsValue = (_fieldKey: string, value: unknown): unknown =>
  value;

const validateFieldValue = (
  fieldType: CollectionFieldType,
  fieldKey: string,
  value: unknown,
): unknown => {
  switch (fieldType) {
    case "text":
      return validateTextValue(fieldKey, value);
    case "long-text":
      return validateLongTextValue(fieldKey, value);
    case "richtext":
      return validateRichtextValue(fieldKey, value);
    case "diagrams":
      return validateDiagramsValue(fieldKey, value);
  }
};

const validateItemValues = (
  fields: CollectionFieldRow[],
  input: { values: Record<string, unknown> },
): ValidatedValue[] => {
  const knownKeys = new Set(fields.map((field) => field.key));

  for (const key of Object.keys(input.values)) {
    if (!knownKeys.has(key)) {
      throw new Error(`Unknown field key "${key}".`);
    }
  }

  const result: ValidatedValue[] = [];
  for (const field of fields) {
    const raw = input.values[field.key];

    if (raw === undefined || raw === null) {
      if (field.required) {
        throw new Error(
          `Item value for field "${field.key}" is required.`,
        );
      }
      result.push({ dataId: 0, fieldId: field.id, key: field.key, value: null });
      continue;
    }

    if (field.required && typeof raw === "string" && raw.trim() === "") {
      throw new Error(`Item value for field "${field.key}" is required.`);
    }

    const value = validateFieldValue(field.fieldType, field.key, raw);
    result.push({ dataId: 0, fieldId: field.id, key: field.key, value });
  }

  return result;
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
    values,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const assembleFromValidated = (
  row: CollectionDataRow,
  validated: ValidatedValue[],
): CollectionItem => {
  const values: Record<string, unknown> = {};
  for (const v of validated) {
    values[v.key] = v.value;
  }
  return {
    id: row.id,
    collectionId: row.collectionId,
    values,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const assertCollectionExists = async (collectionId: number) => {
  const existing = await getCollectionRecord(collectionId);
  if (!existing) {
    throw new Error(`Collection ${collectionId} not found.`);
  }
};

const parseCollectionId = (req: Request) =>
  parseIdParam(String(req.params.collectionId));

const listItemsData = async (
  collectionId: number,
  query: ListPageQuery,
): Promise<PaginatedRows<CollectionItem>> => {
  await assertCollectionExists(collectionId);

  const page = await paginateRows({
    query,
    fetchPage: (limit, offset) =>
      selectCollectionDataPage(collectionId, limit, offset),
    fetchTotal: () => countCollectionData(collectionId),
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
): Promise<CollectionItem | null> => {
  await assertCollectionExists(collectionId);

  const row = await selectCollectionDataById(collectionId, dataId);
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
  input: { values: Record<string, unknown> },
): Promise<CollectionItem> => {
  await assertCollectionExists(collectionId);
  const fields = await listCollectionFieldRecords(collectionId);
  const validated = validateItemValues(fields, input);

  return db.transaction(async (tx) => {
    const data = await insertCollectionData(collectionId, tx);
    await insertCollectionDataValues(
      validated.map((v) => ({ dataId: data.id, fieldId: v.fieldId, value: v.value })),
      tx,
    );
    return assembleFromValidated(data, validated);
  });
};

const updateItemData = async (
  collectionId: number,
  dataId: number,
  input: { values: Record<string, unknown> },
): Promise<CollectionItem> => {
  await assertCollectionExists(collectionId);

  const existing = await selectCollectionDataById(collectionId, dataId);
  if (!existing) {
    throw new Error(`Collection item ${dataId} not found.`);
  }

  const fields = await listCollectionFieldRecords(collectionId);
  const validated = validateItemValues(fields, input);

  await db.transaction(async (tx) => {
    await touchCollectionData(dataId, tx);
    await upsertCollectionDataValues(
      validated.map((v) => ({ dataId, fieldId: v.fieldId, value: v.value })),
      tx,
    );
  });

  const refreshed = await selectCollectionDataById(collectionId, dataId);
  if (!refreshed) {
    throw new Error(`Collection item ${dataId} not found.`);
  }
  return assembleFromValidated(refreshed, validated);
};

const deleteItemData = async (
  collectionId: number,
  dataId: number,
): Promise<{ deleted: true }> => {
  const deleted = await deleteCollectionData(collectionId, dataId);
  if (!deleted) {
    throw new Error(`Collection item ${dataId} not found.`);
  }
  return { deleted: true };
};

export const listItems = async (req: Request, res: Response) => {
  try {
    const collectionId = parseCollectionId(req);
    const result = await listItemsData(collectionId, parseListQuery(req.query));
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const getItem = async (req: Request, res: Response) => {
  try {
    const collectionId = parseCollectionId(req);
    const itemId = parseIdParam(String(req.params.itemId));
    const result = await getItemData(collectionId, itemId);
    if (!result) {
      res
        .status(404)
        .json({ error: `Collection item ${req.params.itemId} not found.` });
      return;
    }
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const createItem = async (req: Request, res: Response) => {
  try {
    const collectionId = parseCollectionId(req);
    const { values } = req.body as CollectionItemBody;
    const result = await createItemData(collectionId, { values });
    res.status(201).json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const collectionId = parseCollectionId(req);
    const itemId = parseIdParam(String(req.params.itemId));
    const { values } = req.body as CollectionItemBody;
    const result = await updateItemData(collectionId, itemId, { values });
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    const collectionId = parseCollectionId(req);
    const itemId = parseIdParam(String(req.params.itemId));
    const result = await deleteItemData(collectionId, itemId);
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};
