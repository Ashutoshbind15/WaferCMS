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
import { parseIdParam, sendRouteError } from "../lib/http";
import type { CollectionBody } from "../lib/validation";

const listCollectionsData = async (query: ListPageQuery) =>
  listCollectionRecords(query);

const getCollectionData = async (id: number) => getCollectionRecord(id);

const createCollectionData = async (input: CollectionBody) =>
  addCollectionRecord(input);

const updateCollectionData = async (id: number, input: CollectionBody) =>
  updateCollectionRecord(id, input);

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
    const result = await createCollectionData(req.body as CollectionBody);
    res.status(201).json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const updateCollection = async (req: Request, res: Response) => {
  try {
    const result = await updateCollectionData(
      parseIdParam(String(req.params.id)),
      req.body as CollectionBody,
    );
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
