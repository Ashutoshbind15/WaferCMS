import { Router } from "express";
import {
  addDiagramRecord,
  deleteDiagramRecord,
  getDiagramRecord,
  listDiagramRecords,
  updateDiagramRecord,
} from "@packages/cms-db/access";
import { parseIdParam, sendRouteError } from "../lib/http";

const router: Router = Router();

router.get("/", async (_req, res) => {
  try {
    const result = await listDiagramRecords();
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await getDiagramRecord(parseIdParam(req.params.id));
    if (!result) {
      res.status(404).json({ error: `Diagram ${req.params.id} not found.` });
      return;
    }
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, payload } = req.body;
    const result = await addDiagramRecord(title, payload);
    res.status(201).json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { title, payload } = req.body;
    const result = await updateDiagramRecord(
      parseIdParam(req.params.id),
      title,
      payload,
    );
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteDiagramRecord(parseIdParam(req.params.id));
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

export default router;
