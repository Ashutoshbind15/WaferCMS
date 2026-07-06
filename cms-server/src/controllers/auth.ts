import type { Request, Response } from "express";
import {
  touchUserLastLogin,
  verifyUserPassword,
} from "@packages/cms-db/users";
import { clearSessionCookie, setSessionCookie } from "../lib/cookies";
import { signSession } from "../lib/session";

type LoginInput = {
  username: string;
  password: string;
};

const loginData = async (input: LoginInput) => {
  const user = await verifyUserPassword(input.username, input.password);
  if (!user) {
    return null;
  }

  const token = await signSession({
    userId: user.id,
    username: user.username,
  });

  void touchUserLastLogin(user.id).catch(() => {});

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
    },
  };
};

export const login = async (req: Request, res: Response) => {
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

    const result = await loginData({ username, password });
    if (!result) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    setSessionCookie(res, result.token);
    res.json({ user: result.user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    if (message.includes("AUTH_SECRET")) {
      res.status(500).json({ error: "Session auth is not configured." });
      return;
    }
    res.status(500).json({ error: message });
  }
};

export const logout = (_req: Request, res: Response) => {
  clearSessionCookie(res);
  res.json({ ok: true });
};

export const me = (req: Request, res: Response) => {
  res.json({
    user: {
      id: req.sessionAuth!.userId,
      username: req.sessionAuth!.username,
    },
  });
};
