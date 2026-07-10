import { Router } from "express";
import {
  createApiKeyHandler,
  listApiKeysHandler,
  revokeApiKeyHandler,
} from "../controllers/api-keys.js";
import { validateBody } from "../middleware/validate-body.js";
import {
  createApiKeyBodySchema,
  revokeApiKeyBodySchema,
} from "../lib/validation.js";

const router: Router = Router();

router.get("/", listApiKeysHandler);
router.post("/", validateBody(createApiKeyBodySchema), createApiKeyHandler);
router.patch("/:id", validateBody(revokeApiKeyBodySchema), revokeApiKeyHandler);

export default router;
