import { Router } from "express";
import { login, logout, me } from "../controllers/auth.js";
import { sessionAuthMiddleware } from "../middleware/session-auth.js";
import { validateBody } from "../middleware/validate-body.js";
import { loginBodySchema } from "../lib/validation.js";

const router: Router = Router();

router.post("/login", validateBody(loginBodySchema), login);
router.post("/logout", logout);
router.get("/me", sessionAuthMiddleware, me);

export default router;
