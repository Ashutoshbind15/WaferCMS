import { Router } from "express";
import {
  addCollectionRecord,
  deleteCollectionRecord,
  getCollectionRecord,
  listCollectionRecords,
  updateCollectionRecord,
} from "@packages/cms-db/collections";
import { parseListQuery } from "../lib/pagination";
import { parseIdParam, sendRouteError } from "../lib/http";
import collectionFieldsRouter from "./collection-fields";
import collectionItemsRouter from "./collection-items";

const router: Router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const result = await listCollectionRecords(parseListQuery(req.query));
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await getCollectionRecord(parseIdParam(req.params.id));
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
});

router.post("/", async (req, res) => {
  try {
    const { slug, title, description } = req.body;
    const result = await addCollectionRecord({ slug, title, description });
    res.status(201).json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { slug, title, description } = req.body;
    const result = await updateCollectionRecord(parseIdParam(req.params.id), {
      slug,
      title,
      description,
    });
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteCollectionRecord(parseIdParam(req.params.id));
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.use("/:collectionId/fields", collectionFieldsRouter);
router.use("/:collectionId/items", collectionItemsRouter);

export default router;
