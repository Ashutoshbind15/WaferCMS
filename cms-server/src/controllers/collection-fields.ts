import type { Request, Response } from "express";
import {
  addCollectionFieldRecord,
  countCollectionFieldRecords,
  deleteCollectionFieldRecord,
  getCollectionFieldRecord,
  getCollectionRecord,
  listCollectionFieldRecords,
  updateCollectionFieldRecord,
} from "@packages/cms-db/collections";
import { parseIdParam } from "../lib/http";
import type { CollectionFieldBody } from "../lib/validation";

const parseCollectionId = (req: Request) =>
  parseIdParam(String(req.params.collectionId));

export const listFields = async (req: Request, res: Response) => {
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

  const result = await listCollectionFieldRecords(collectionId);
  res.json({ data: result });
};

export const getField = async (req: Request, res: Response) => {
  const collectionId = parseCollectionId(req);
  if (collectionId === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  const fieldId = parseIdParam(String(req.params.fieldId));
  if (fieldId === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  const result = await getCollectionFieldRecord(collectionId, fieldId);
  if (!result) {
    res.status(404).json({
      error: `Collection field ${req.params.fieldId} not found.`,
    });
    return;
  }
  res.json(result);
};

export const createField = async (req: Request, res: Response) => {
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

  const position = await countCollectionFieldRecords(collectionId);
  try {
    const result = await addCollectionFieldRecord(collectionId, {
      ...(req.body as CollectionFieldBody),
      position,
    });
    res.status(201).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    res.status(500).json({ error: message });
  }
};

export const updateField = async (req: Request, res: Response) => {
  const collectionId = parseCollectionId(req);
  if (collectionId === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  const fieldId = parseIdParam(String(req.params.fieldId));
  if (fieldId === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  try {
    const result = await updateCollectionFieldRecord(
      collectionId,
      fieldId,
      req.body as CollectionFieldBody,
    );
    res.json(result);
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

export const deleteField = async (req: Request, res: Response) => {
  const collectionId = parseCollectionId(req);
  if (collectionId === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  const fieldId = parseIdParam(String(req.params.fieldId));
  if (fieldId === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  try {
    const result = await deleteCollectionFieldRecord(collectionId, fieldId);
    res.json(result);
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
