import { Router } from "express";
import {
  createItem,
  deleteItem,
  getItem,
  listItems,
  updateItem,
} from "../controllers/collection-items";
import { validateBody } from "../middleware/validate-body";
import { collectionItemBodySchema } from "../lib/validation";

const router: Router = Router({ mergeParams: true });

router.get("/", listItems);
router.get("/:itemId", getItem);
router.post("/", validateBody(collectionItemBodySchema), createItem);
router.put("/:itemId", validateBody(collectionItemBodySchema), updateItem);
router.delete("/:itemId", deleteItem);

export default router;
