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
import { parseTitle } from "../lib/validation";
import { parseIdParam, sendRouteError } from "../lib/http";

const listContentData = async (query: ListPageQuery) =>
  listContentRecords(query);

const getContentData = async (id: number) => getContentRecord(id);

const createContentData = async (title: unknown, payload: unknown) =>
  addContentRecord(parseTitle(title), payload);

const updateContentData = async (
  id: number,
  title: unknown,
  payload: unknown,
) => updateContentRecord(id, parseTitle(title), payload);

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
    const { title, payload } = req.body;
    const result = await createContentData(title, payload);
    res.status(201).json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const updateContent = async (req: Request, res: Response) => {
  try {
    const { title, payload } = req.body;
    const result = await updateContentData(
      parseIdParam(String(req.params.id)),
      title,
      payload,
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
