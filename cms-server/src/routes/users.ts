import { Router } from "express";
import { createUser, disableUser, listUsers } from "@packages/cms-db/users";
import { parseIdParam, sendRouteError } from "../lib/http";

const router: Router = Router();

router.get("/", async (_req, res) => {
  try {
    const users = await listUsers();
    res.json({ data: users });
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.post("/", async (req, res) => {
  try {
    const { username, password } = req.body as {
      username?: unknown;
      password?: unknown;
    };

    if (typeof username !== "string" || !username.trim()) {
      res.status(400).json({ error: "Username is required." });
      return;
    }

    if (typeof password !== "string" || !password) {
      res.status(400).json({ error: "Password is required." });
      return;
    }

    const user = await createUser({ username, password });
    res.status(201).json(user);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { enabled } = req.body as { enabled?: unknown };

    if (enabled !== false) {
      res.status(400).json({ error: "Only disabling users is supported." });
      return;
    }

    const user = await disableUser(parseIdParam(req.params.id));
    res.json(user);
  } catch (error) {
    sendRouteError(res, error);
  }
});

export default router;
