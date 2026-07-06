import { Router } from "express";
import {
  createCollection,
  deleteCollection,
  getCollection,
  listCollections,
  updateCollection,
} from "../controllers/collections";
import collectionFieldsRouter from "./collection-fields";
import collectionItemsRouter from "./collection-items";
import { validateBody } from "../middleware/validate-body";
import { collectionBodySchema } from "../lib/validation";

const router: Router = Router({ mergeParams: true });

router.get("/", listCollections);
router.get("/:id", getCollection);
router.post("/", validateBody(collectionBodySchema), createCollection);
router.put("/:id", validateBody(collectionBodySchema), updateCollection);
router.delete("/:id", deleteCollection);

router.use("/:collectionId/fields", collectionFieldsRouter);
router.use("/:collectionId/items", collectionItemsRouter);

export default router;
