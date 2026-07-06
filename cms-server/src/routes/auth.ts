import { Router } from "express";
import { login, logout, me } from "../controllers/auth";
import { sessionAuthMiddleware } from "../middleware/session-auth";
import { validateBody } from "../middleware/validate-body";
import { loginBodySchema } from "../lib/validation";

const router: Router = Router();

router.post("/login", validateBody(loginBodySchema), login);
router.post("/logout", logout);
router.get("/me", sessionAuthMiddleware, me);

export default router;
