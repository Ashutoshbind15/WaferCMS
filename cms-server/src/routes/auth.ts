import { Router } from "express";
import {
  touchUserLastLogin,
  verifyUserPassword,
} from "@packages/cms-db/users";
import { clearSessionCookie, setSessionCookie } from "../lib/cookies";
import { signSession } from "../lib/session";
import { sessionAuthMiddleware } from "../middleware/session-auth";

const router: Router = Router();

router.post("/login", async (req, res) => {
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

    const user = await verifyUserPassword(username, password);
    if (!user) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    const token = await signSession({
      userId: user.id,
      username: user.username,
    });

    setSessionCookie(res, token);
    void touchUserLastLogin(user.id).catch(() => {});

    res.json({
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    if (message.includes("AUTH_SECRET")) {
      res.status(500).json({ error: "Session auth is not configured." });
      return;
    }
    res.status(500).json({ error: message });
  }
});

router.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get("/me", sessionAuthMiddleware, (req, res) => {
  res.json({
    user: {
      id: req.sessionAuth!.userId,
      username: req.sessionAuth!.username,
    },
  });
});

export default router;
