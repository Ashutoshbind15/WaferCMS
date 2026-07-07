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
import { parseIdParam, sendCreatedId, sendNoContent } from "../lib/http";
import type { DiagramBody } from "../lib/validation";

export const listDiagrams = async (req: Request, res: Response) => {
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
    const result = await listDiagramRecords(query);
    res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    res.status(500).json({ error: message });
  }
};

export const getDiagram = async (req: Request, res: Response) => {
  const id = parseIdParam(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  const result = await getDiagramRecord(id);
  if (!result) {
    res.status(404).json({ error: `Diagram ${req.params.id} not found.` });
    return;
  }
  res.json(result);
};

export const createDiagram = async (req: Request, res: Response) => {
  try {
    const result = await addDiagramRecord(
      req.body.title,
      req.body.payload,
    );
    sendCreatedId(res, result.id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    res.status(500).json({ error: message });
  }
};

export const updateDiagram = async (req: Request, res: Response) => {
  const id = parseIdParam(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  const body = req.body as DiagramBody;
  try {
    await updateDiagramRecord(id, body.title, body.payload);
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

export const deleteDiagram = async (req: Request, res: Response) => {
  const id = parseIdParam(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  try {
    await deleteDiagramRecord(id);
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
