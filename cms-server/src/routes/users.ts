import { Router } from "express";
import {
  createUserHandler,
  disableUserHandler,
  listUsersHandler,
} from "../controllers/users.js";
import { validateBody } from "../middleware/validate-body.js";
import {
  createUserBodySchema,
  disableUserBodySchema,
} from "../lib/validation.js";

const router: Router = Router();

router.get("/", listUsersHandler);
router.post("/", validateBody(createUserBodySchema), createUserHandler);
router.patch("/:id", validateBody(disableUserBodySchema), disableUserHandler);

export default router;
