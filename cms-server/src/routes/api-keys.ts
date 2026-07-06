import { Router } from "express";
import {
  createApiKeyHandler,
  listApiKeysHandler,
  revokeApiKeyHandler,
} from "../controllers/api-keys";

const router: Router = Router();

router.get("/", listApiKeysHandler);
router.post("/", createApiKeyHandler);
router.patch("/:id", revokeApiKeyHandler);

export default router;
