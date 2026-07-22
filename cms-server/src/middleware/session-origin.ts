import type { NextFunction, Request, Response } from "express";
import { env } from "../env.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const originFromReferer = (referer: string | undefined): string | null => {
  if (!referer) {
    return null;
  }
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
};

const requestOrigin = (req: Request): string | null => {
  const origin = req.get("origin")?.trim();
  if (origin) {
    return origin;
  }
  return originFromReferer(req.get("referer") ?? undefined);
};

const hasBearerAuth = (req: Request): boolean => {
  const header = req.get("authorization");
  return typeof header === "string" && /^Bearer\s+\S+/i.test(header);
};

/**
 * CSRF guard for cookie-authenticated mutations.
 * Requires Origin (or Referer) to match CORS_ORIGIN.
 * Bearer API-key calls are skipped.
 */
export const sessionOriginGuard = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const allowed = env.CORS_ORIGIN;
  if (!allowed) {
    next();
    return;
  }

  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    next();
    return;
  }

  if (hasBearerAuth(req)) {
    next();
    return;
  }

  // Only cookie-authenticated browser calls need an Origin match.
  if (!req.headers.cookie) {
    next();
    return;
  }

  const origin = requestOrigin(req);
  if (!origin || origin !== allowed) {
    res.status(403).json({ error: "Invalid request origin." });
    return;
  }

  next();
};
