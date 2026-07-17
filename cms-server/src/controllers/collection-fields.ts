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
import { parseIdParam, sendNoContent } from "../lib/http.js";
import type { CollectionFieldBody } from "../lib/validation.js";

const parseCollectionId = (req: Request) =>
  parseIdParam(String(req.params.collectionId));

/**
 * DB checks Zod cannot do: related collection exists and is not self.
 * Presence of relatedCollectionId for relation fields is enforced by
 * collectionFieldBodySchema before this runs.
 */
const assertRelatedCollectionTarget = async (
  collectionId: number,
  relatedCollectionId: number,
): Promise<string | null> => {
  if (relatedCollectionId === collectionId) {
    return "Relation fields cannot target the same collection.";
  }

  const related = await getCollectionRecord(relatedCollectionId);
  if (!related) {
    return `Related collection ${relatedCollectionId} not found.`;
  }

  return null;
};

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

  const body = req.body as CollectionFieldBody;
  if (body.fieldType === "relation") {
    // Zod already requires a positive relatedCollectionId for relation fields.
    const relationError = await assertRelatedCollectionTarget(
      collectionId,
      body.relatedCollectionId as number,
    );
    if (relationError) {
      res.status(400).json({ error: relationError });
      return;
    }
  }

  const position = await countCollectionFieldRecords(collectionId);
  try {
    await addCollectionFieldRecord(collectionId, {
      ...body,
      position,
    });
    sendNoContent(res);
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

  const body = req.body as CollectionFieldBody;
  if (body.fieldType === "relation") {
    const relationError = await assertRelatedCollectionTarget(
      collectionId,
      body.relatedCollectionId as number,
    );
    if (relationError) {
      res.status(400).json({ error: relationError });
      return;
    }
  }

  try {
    await updateCollectionFieldRecord(collectionId, fieldId, body);
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
    await deleteCollectionFieldRecord(collectionId, fieldId);
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
