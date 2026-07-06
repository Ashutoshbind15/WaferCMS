import { Router } from "express";
import {
  createUserHandler,
  disableUserHandler,
  listUsersHandler,
} from "../controllers/users";

const router: Router = Router();

router.get("/", listUsersHandler);
router.post("/", createUserHandler);
router.patch("/:id", disableUserHandler);

export default router;
