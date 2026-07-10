import type { NextFunction, Request, Response } from "express";
import { trySessionAuth } from "./session-auth.js";
import { apiKeyAuthMiddleware } from "./api-key-auth.js";

export const contentAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session = await trySessionAuth(req);
  if (session) {
    req.sessionAuth = session;
    next();
    return;
  }

  await apiKeyAuthMiddleware(req, res, next);
};
