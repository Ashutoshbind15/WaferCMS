import type { Request, Response } from "express";
import {
  addCollectionRecord,
  deleteCollectionRecord,
  getCollectionRecord,
  listCollectionRecords,
  updateCollectionRecord,
} from "@packages/cms-db/collections";
import { type ListPageQuery } from "@packages/cms-db/pagination";
import { parseCollectionInput } from "../lib/collections";
import { parseListQuery } from "../lib/pagination";
import { parseIdParam, sendRouteError } from "../lib/http";

const listCollectionsData = async (query: ListPageQuery) =>
  listCollectionRecords(query);

const getCollectionData = async (id: number) => getCollectionRecord(id);

const createCollectionData = async (input: {
  slug: unknown;
  title: unknown;
  description?: unknown;
}) => addCollectionRecord(parseCollectionInput(input));

const updateCollectionData = async (
  id: number,
  input: { slug: unknown; title: unknown; description?: unknown },
) => updateCollectionRecord(id, parseCollectionInput(input));

const deleteCollectionData = async (id: number) => deleteCollectionRecord(id);

export const listCollections = async (req: Request, res: Response) => {
  try {
    const result = await listCollectionsData(parseListQuery(req.query));
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const getCollection = async (req: Request, res: Response) => {
  try {
    const result = await getCollectionData(parseIdParam(String(req.params.id)));
    if (!result) {
      res
        .status(404)
        .json({ error: `Collection ${req.params.id} not found.` });
      return;
    }
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const createCollection = async (req: Request, res: Response) => {
  try {
    const { slug, title, description } = req.body;
    const result = await createCollectionData({ slug, title, description });
    res.status(201).json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const updateCollection = async (req: Request, res: Response) => {
  try {
    const { slug, title, description } = req.body;
    const result = await updateCollectionData(parseIdParam(String(req.params.id)), {
      slug,
      title,
      description,
    });
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const deleteCollection = async (req: Request, res: Response) => {
  try {
    const result = await deleteCollectionData(parseIdParam(String(req.params.id)));
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};
