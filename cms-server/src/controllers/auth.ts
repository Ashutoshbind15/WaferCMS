import type { Request, Response } from "express";
import { findUserByUsername, touchUserLastLogin } from "@packages/cms-db/users";
import { clearSessionCookie, setSessionCookie } from "../lib/cookies";
import { verifyPassword } from "../lib/password";
import { signSession } from "../lib/session";
import type { LoginBody } from "../lib/validation";

const loginData = async (input: LoginBody) => {
  const record = await findUserByUsername(input.username);
  if (!record || !record.enabled) {
    return null;
  }

  const matches = await verifyPassword(input.password, record.passwordHash);
  if (!matches) {
    return null;
  }

  const token = await signSession({
    userId: record.id,
    username: record.username,
  });

  void touchUserLastLogin(record.id).catch(() => {});

  return {
    token,
    user: {
      id: record.id,
      username: record.username,
    },
  };
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await loginData(req.body as LoginBody);
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
