import { Router } from "express";
import {
  createDiagram,
  deleteDiagram,
  getDiagram,
  listDiagrams,
  updateDiagram,
} from "../controllers/diagrams";
import { validateBody } from "../middleware/validate-body";
import { diagramBodySchema } from "../lib/validation";

const router: Router = Router();

router.get("/", listDiagrams);
router.get("/:id", getDiagram);
router.post("/", validateBody(diagramBodySchema), createDiagram);
router.put("/:id", validateBody(diagramBodySchema), updateDiagram);
router.delete("/:id", deleteDiagram);

export default router;
