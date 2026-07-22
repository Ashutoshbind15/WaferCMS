import type { Request, Response } from "express";
import {
  addCollectionRecord,
  deleteCollectionRecord,
  getCollectionRecord,
  getCollectionRecordBySlug,
  listCollectionRecords,
  updateCollectionRecord,
} from "@packages/cms-db/collections";
import { type ListPageQuery } from "@packages/cms-db/pagination";
import { parseListQuery } from "../lib/pagination.js";
import { parseIdParam, sendCreatedId, sendNoContent, sendServerError } from "../lib/http.js";
import type { CollectionBody } from "../lib/validation.js";

export const listCollections = async (req: Request, res: Response) => {
  let query: ListPageQuery;
  try {
    query = parseListQuery(req.query);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    res.status(400).json({ error: message });
    return;
  }

  try {
    const result = await listCollectionRecords(query);
    res.json(result);
  } catch (error) {
    sendServerError(res, error);
  }
};

export const getCollectionBySlug = async (req: Request, res: Response) => {
  const slug = String(req.params.slug ?? "").trim();
  if (!slug) {
    res.status(400).json({ error: "Slug is required." });
    return;
  }

  const result = await getCollectionRecordBySlug(slug);
  if (!result) {
    res.status(404).json({ error: `Collection "${slug}" not found.` });
    return;
  }
  res.json(result);
};

export const getCollection = async (req: Request, res: Response) => {
  const id = parseIdParam(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  const result = await getCollectionRecord(id);
  if (!result) {
    res.status(404).json({ error: `Collection ${req.params.id} not found.` });
    return;
  }
  res.json(result);
};

export const createCollection = async (req: Request, res: Response) => {
  try {
    const result = await addCollectionRecord(req.body as CollectionBody);
    sendCreatedId(res, result.id);
  } catch (error) {
    sendServerError(res, error);
  }
};

export const updateCollection = async (req: Request, res: Response) => {
  const id = parseIdParam(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  try {
    await updateCollectionRecord(id, req.body as CollectionBody);
    sendNoContent(res);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    if (message.endsWith("not found.")) {
      res.status(404).json({ error: message });
      return;
    }
    sendServerError(res, error);
  }
};

export const deleteCollection = async (req: Request, res: Response) => {
  const id = parseIdParam(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  try {
    await deleteCollectionRecord(id);
    sendNoContent(res);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    if (message.endsWith("not found.")) {
      res.status(404).json({ error: message });
      return;
    }
    sendServerError(res, error);
  }
};
