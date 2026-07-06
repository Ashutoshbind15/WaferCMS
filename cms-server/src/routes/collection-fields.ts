import { Router, type Request } from "express";
import {
  addCollectionFieldRecord,
  deleteCollectionFieldRecord,
  getCollectionFieldRecord,
  listCollectionFieldRecords,
  updateCollectionFieldRecord,
} from "@packages/cms-db/collections";
import { parseIdParam, sendRouteError } from "../lib/http";

const router: Router = Router({ mergeParams: true });

const parseCollectionId = (req: Request) =>
  parseIdParam(String(req.params.collectionId));

router.get("/", async (req, res) => {
  try {
    const collectionId = parseCollectionId(req);
    const result = await listCollectionFieldRecords(collectionId);
    res.json({ data: result });
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.get("/:fieldId", async (req, res) => {
  try {
    const collectionId = parseCollectionId(req);
    const fieldId = parseIdParam(req.params.fieldId);
    const result = await getCollectionFieldRecord(collectionId, fieldId);
    if (!result) {
      res.status(404).json({
        error: `Collection field ${req.params.fieldId} not found.`,
      });
      return;
    }
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.post("/", async (req, res) => {
  try {
    const collectionId = parseCollectionId(req);
    const { key, label, fieldType, required } = req.body;
    const result = await addCollectionFieldRecord(collectionId, {
      key,
      label,
      fieldType,
      required,
    });
    res.status(201).json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.put("/:fieldId", async (req, res) => {
  try {
    const collectionId = parseCollectionId(req);
    const fieldId = parseIdParam(req.params.fieldId);
    const { key, label, fieldType, required } = req.body;
    const result = await updateCollectionFieldRecord(collectionId, fieldId, {
      key,
      label,
      fieldType,
      required,
    });
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.delete("/:fieldId", async (req, res) => {
  try {
    const collectionId = parseCollectionId(req);
    const fieldId = parseIdParam(req.params.fieldId);
    const result = await deleteCollectionFieldRecord(collectionId, fieldId);
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

export default router;
