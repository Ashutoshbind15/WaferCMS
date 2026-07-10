import type { NextFunction, Request, Response } from "express";
import { findUserById } from "@packages/cms-db/users";
import { getSessionCookieName } from "../lib/cookies.js";
import { verifySession } from "../lib/session.js";

export type SessionAuthContext = {
  userId: number;
  username: string;
};

declare global {
  namespace Express {
    interface Request {
      sessionAuth?: SessionAuthContext;
    }
  }
}

export const sessionAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.[getSessionCookieName()] as string | undefined;
  const payload = await verifySession(token);

  if (!payload) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  const user = await findUserById(payload.userId);
  if (!user || !user.enabled) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  req.sessionAuth = {
    userId: user.id,
    username: user.username,
  };

  next();
};

export const trySessionAuth = async (
  req: Request,
): Promise<SessionAuthContext | null> => {
  const token = req.cookies?.[getSessionCookieName()] as string | undefined;
  const payload = await verifySession(token);

  if (!payload) {
    return null;
  }

  const user = await findUserById(payload.userId);
  if (!user || !user.enabled) {
    return null;
  }

  return {
    userId: user.id,
    username: user.username,
  };
};
