import { Router } from "express";
import {
  createUserHandler,
  disableUserHandler,
  listUsersHandler,
} from "../controllers/users";
import { validateBody } from "../middleware/validate-body";
import {
  createUserBodySchema,
  disableUserBodySchema,
} from "../lib/validation";

const router: Router = Router();

router.get("/", listUsersHandler);
router.post("/", validateBody(createUserBodySchema), createUserHandler);
router.patch("/:id", validateBody(disableUserBodySchema), disableUserHandler);

export default router;
