import type { Request, Response } from "express";
import {
  addCollectionRecord,
  deleteCollectionRecord,
  getCollectionRecord,
  listCollectionRecords,
  updateCollectionRecord,
} from "@packages/cms-db/collections";
import { type ListPageQuery } from "@packages/cms-db/pagination";
import { parseListQuery } from "../lib/pagination";
import { parseIdParam } from "../lib/http";
import type { CollectionBody } from "../lib/validation";

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
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    res.status(500).json({ error: message });
  }
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
    res.status(201).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    res.status(500).json({ error: message });
  }
};

export const updateCollection = async (req: Request, res: Response) => {
  const id = parseIdParam(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  try {
    const result = await updateCollectionRecord(id, req.body as CollectionBody);
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

export const deleteCollection = async (req: Request, res: Response) => {
  const id = parseIdParam(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  try {
    const result = await deleteCollectionRecord(id);
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
