import { Router } from "express";
import { draftItem } from "../controllers/collection-ai.js";
import { validateBody } from "../middleware/validate-body.js";
import { aiRateLimiter } from "../middleware/rate-limits.js";
import { aiDraftBodySchema } from "../lib/validation.js";

const router: Router = Router({ mergeParams: true });

router.post(
  "/draft",
  aiRateLimiter,
  validateBody(aiDraftBodySchema),
  draftItem,
);

export default router;
