import { Router } from "express";
import {
  createItem,
  deleteItem,
  getItem,
  listItems,
  updateItem,
} from "../controllers/collection-items";

const router: Router = Router({ mergeParams: true });

router.get("/", listItems);
router.get("/:itemId", getItem);
router.post("/", createItem);
router.put("/:itemId", updateItem);
router.delete("/:itemId", deleteItem);

export default router;
