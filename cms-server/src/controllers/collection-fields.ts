import type { Request, Response } from "express";
import {
  addCollectionFieldRecord,
  deleteCollectionFieldRecord,
  getCollectionFieldRecord,
  getCollectionRecord,
  listCollectionFieldRecords,
  updateCollectionFieldRecord,
} from "@packages/cms-db/collections";
import { parseIdParam, sendRouteError } from "../lib/http";
import type { CollectionFieldBody } from "../lib/validation";

const parseCollectionId = (req: Request) =>
  parseIdParam(String(req.params.collectionId));

const assertCollectionExists = async (collectionId: number) => {
  const existing = await getCollectionRecord(collectionId);
  if (!existing) {
    throw new Error(`Collection ${collectionId} not found.`);
  }
};

const listFieldsData = async (collectionId: number) => {
  await assertCollectionExists(collectionId);
  return listCollectionFieldRecords(collectionId);
};

const getFieldData = async (collectionId: number, fieldId: number) =>
  getCollectionFieldRecord(collectionId, fieldId);

const createFieldData = async (
  collectionId: number,
  input: CollectionFieldBody,
) => {
  await assertCollectionExists(collectionId);
  return addCollectionFieldRecord(collectionId, input);
};

const updateFieldData = async (
  collectionId: number,
  fieldId: number,
  input: CollectionFieldBody,
) => updateCollectionFieldRecord(collectionId, fieldId, input);

const deleteFieldData = async (collectionId: number, fieldId: number) =>
  deleteCollectionFieldRecord(collectionId, fieldId);

export const listFields = async (req: Request, res: Response) => {
  try {
    const collectionId = parseCollectionId(req);
    const result = await listFieldsData(collectionId);
    res.json({ data: result });
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const getField = async (req: Request, res: Response) => {
  try {
    const collectionId = parseCollectionId(req);
    const fieldId = parseIdParam(String(req.params.fieldId));
    const result = await getFieldData(collectionId, fieldId);
    if (!result) {
      res.status(404).json({
        error: `Collection field ${req.params.fieldId} not found.`,
      });
      return;
    }
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const createField = async (req: Request, res: Response) => {
  try {
    const collectionId = parseCollectionId(req);
    const result = await createFieldData(
      collectionId,
      req.body as CollectionFieldBody,
    );
    res.status(201).json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const updateField = async (req: Request, res: Response) => {
  try {
    const collectionId = parseCollectionId(req);
    const fieldId = parseIdParam(String(req.params.fieldId));
    const result = await updateFieldData(
      collectionId,
      fieldId,
      req.body as CollectionFieldBody,
    );
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const deleteField = async (req: Request, res: Response) => {
  try {
    const collectionId = parseCollectionId(req);
    const fieldId = parseIdParam(String(req.params.fieldId));
    const result = await deleteFieldData(collectionId, fieldId);
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};
