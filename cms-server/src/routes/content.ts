import { Router } from "express";
import {
  createContent,
  deleteContent,
  getContent,
  listContent,
  updateContent,
} from "../controllers/content";
import { validateBody } from "../middleware/validate-body";
import { contentBodySchema } from "../lib/validation";

const router: Router = Router();

router.get("/", listContent);
router.get("/:id", getContent);
router.post("/", validateBody(contentBodySchema), createContent);
router.put("/:id", validateBody(contentBodySchema), updateContent);
router.delete("/:id", deleteContent);

export default router;
