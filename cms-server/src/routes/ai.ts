import { Router } from "express";
import { runAiAgent } from "../controllers/ai-run.js";
import { validateBody } from "../middleware/validate-body.js";
import { aiAgentRunBodySchema } from "../lib/validation.js";

const router: Router = Router();

router.post("/run", validateBody(aiAgentRunBodySchema), runAiAgent);

export default router;
