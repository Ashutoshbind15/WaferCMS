import { Router } from "express";
import {
  createDiagram,
  deleteDiagram,
  getDiagram,
  listDiagrams,
  updateDiagram,
} from "../controllers/diagrams";

const router: Router = Router();

router.get("/", listDiagrams);
router.get("/:id", getDiagram);
router.post("/", createDiagram);
router.put("/:id", updateDiagram);
router.delete("/:id", deleteDiagram);

export default router;
