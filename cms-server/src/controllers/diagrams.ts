import type { Request, Response } from "express";
import {
  addDiagramRecord,
  deleteDiagramRecord,
  getDiagramRecord,
  listDiagramRecords,
  updateDiagramRecord,
} from "@packages/cms-db/access";
import { type ListPageQuery } from "@packages/cms-db/pagination";
import { parseListQuery } from "../lib/pagination";
import { parseTitle } from "../lib/validation";
import { parseIdParam, sendRouteError } from "../lib/http";

const listDiagramsData = async (query: ListPageQuery) =>
  listDiagramRecords(query);

const getDiagramData = async (id: number) => getDiagramRecord(id);

const createDiagramData = async (title: unknown, payload: unknown) =>
  addDiagramRecord(parseTitle(title), payload);

const updateDiagramData = async (
  id: number,
  title: unknown,
  payload: unknown,
) => updateDiagramRecord(id, parseTitle(title), payload);

const deleteDiagramData = async (id: number) => deleteDiagramRecord(id);

export const listDiagrams = async (req: Request, res: Response) => {
  try {
    const result = await listDiagramsData(parseListQuery(req.query));
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const getDiagram = async (req: Request, res: Response) => {
  try {
    const result = await getDiagramData(parseIdParam(String(req.params.id)));
    if (!result) {
      res.status(404).json({ error: `Diagram ${req.params.id} not found.` });
      return;
    }
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const createDiagram = async (req: Request, res: Response) => {
  try {
    const { title, payload } = req.body;
    const result = await createDiagramData(title, payload);
    res.status(201).json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const updateDiagram = async (req: Request, res: Response) => {
  try {
    const { title, payload } = req.body;
    const result = await updateDiagramData(
      parseIdParam(String(req.params.id)),
      title,
      payload,
    );
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const deleteDiagram = async (req: Request, res: Response) => {
  try {
    const result = await deleteDiagramData(parseIdParam(String(req.params.id)));
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};
