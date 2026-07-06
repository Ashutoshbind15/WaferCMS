import type { Request, Response } from "express";
import {
  addContentRecord,
  deleteContentRecord,
  getContentRecord,
  listContentRecords,
  updateContentRecord,
} from "@packages/cms-db/access";
import { type ListPageQuery } from "@packages/cms-db/pagination";
import { parseListQuery } from "../lib/pagination";
import { parseIdParam, sendRouteError } from "../lib/http";
import type { ContentBody } from "../lib/validation";

const listContentData = async (query: ListPageQuery) =>
  listContentRecords(query);

const getContentData = async (id: number) => getContentRecord(id);

const createContentData = async (input: ContentBody) =>
  addContentRecord(input.title, input.payload);

const updateContentData = async (id: number, input: ContentBody) =>
  updateContentRecord(id, input.title, input.payload);

const deleteContentData = async (id: number) => deleteContentRecord(id);

export const listContent = async (req: Request, res: Response) => {
  try {
    const result = await listContentData(parseListQuery(req.query));
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const getContent = async (req: Request, res: Response) => {
  try {
    const result = await getContentData(parseIdParam(String(req.params.id)));
    if (!result) {
      res.status(404).json({ error: `Content ${req.params.id} not found.` });
      return;
    }
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const createContent = async (req: Request, res: Response) => {
  try {
    const result = await createContentData(req.body as ContentBody);
    res.status(201).json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const updateContent = async (req: Request, res: Response) => {
  try {
    const result = await updateContentData(
      parseIdParam(String(req.params.id)),
      req.body as ContentBody,
    );
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const deleteContent = async (req: Request, res: Response) => {
  try {
    const result = await deleteContentData(parseIdParam(String(req.params.id)));
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};
