import { Router } from "express";
import {
  createField,
  deleteField,
  getField,
  listFields,
  updateField,
} from "../controllers/collection-fields";
import { validateBody } from "../middleware/validate-body";
import { collectionFieldBodySchema } from "../lib/validation";

const router: Router = Router({ mergeParams: true });

router.get("/", listFields);
router.get("/:fieldId", getField);
router.post("/", validateBody(collectionFieldBodySchema), createField);
router.put("/:fieldId", validateBody(collectionFieldBodySchema), updateField);
router.delete("/:fieldId", deleteField);

export default router;
