import { Router } from "express";
import {
  createField,
  deleteField,
  getField,
  listFields,
  updateField,
} from "../controllers/collection-fields";

const router: Router = Router({ mergeParams: true });

router.get("/", listFields);
router.get("/:fieldId", getField);
router.post("/", createField);
router.put("/:fieldId", updateField);
router.delete("/:fieldId", deleteField);

export default router;
