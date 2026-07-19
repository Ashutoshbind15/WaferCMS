import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";

export type SessionAuthContext = {
  userId: string;
  username: string;
};

declare global {
  namespace Express {
    interface Request {
      sessionAuth?: SessionAuthContext;
    }
  }
}

const sessionFromRequest = async (
  req: Request,
): Promise<SessionAuthContext | null> => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user) {
    return null;
  }

  const username = session.user.username;
  if (!username) {
    return null;
  }

  if (session.user.enabled === false) {
    return null;
  }

  return {
    userId: session.user.id,
    username,
  };
};

export const sessionAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const sessionAuth = await sessionFromRequest(req);
  if (!sessionAuth) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  req.sessionAuth = sessionAuth;
  next();
};

export const trySessionAuth = async (
  req: Request,
): Promise<SessionAuthContext | null> => sessionFromRequest(req);
