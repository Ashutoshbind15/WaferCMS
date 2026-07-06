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

const router: Router = Router({ mergeParams: true });

router.get("/", listCollections);
router.get("/:id", getCollection);
router.post("/", createCollection);
router.put("/:id", updateCollection);
router.delete("/:id", deleteCollection);

router.use("/:collectionId/fields", collectionFieldsRouter);
router.use("/:collectionId/items", collectionItemsRouter);

export default router;
