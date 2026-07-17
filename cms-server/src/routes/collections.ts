import { Router } from "express";
import {
  createCollection,
  deleteCollection,
  getCollection,
  getCollectionBySlug,
  listCollections,
  updateCollection,
} from "../controllers/collections.js";
import collectionAiRouter from "./collection-ai.js";
import collectionFieldsRouter from "./collection-fields.js";
import collectionItemsRouter from "./collection-items.js";
import { validateBody } from "../middleware/validate-body.js";
import { collectionBodySchema } from "../lib/validation.js";

const router: Router = Router({ mergeParams: true });

router.get("/", listCollections);
router.get("/by-slug/:slug", getCollectionBySlug);
router.get("/:id", getCollection);
router.post("/", validateBody(collectionBodySchema), createCollection);
router.put("/:id", validateBody(collectionBodySchema), updateCollection);
router.delete("/:id", deleteCollection);

router.use("/:collectionId/fields", collectionFieldsRouter);
router.use("/:collectionId/items", collectionItemsRouter);
router.use("/:collectionId/ai", collectionAiRouter);

export default router;
