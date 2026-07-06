import { Router } from "express";
import {
  createContent,
  deleteContent,
  getContent,
  listContent,
  updateContent,
} from "../controllers/content";

const router: Router = Router();

router.get("/", listContent);
router.get("/:id", getContent);
router.post("/", createContent);
router.put("/:id", updateContent);
router.delete("/:id", deleteContent);

export default router;
