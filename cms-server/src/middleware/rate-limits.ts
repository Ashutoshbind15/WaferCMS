import { rateLimit } from "express-rate-limit";
import { env } from "../env.js";

/** Tight limit on credential sign-in (Better Auth username path). */
export const loginRateLimiter = rateLimit({
  windowMs: env.CMS_RATE_LIMIT_LOGIN_WINDOW_MS,
  limit: env.CMS_RATE_LIMIT_LOGIN_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: "Too many login attempts. Try again later." });
  },
});

/** Moderate limit for AI draft / agent endpoints. */
export const aiRateLimiter = rateLimit({
  windowMs: env.CMS_RATE_LIMIT_AI_WINDOW_MS,
  limit: env.CMS_RATE_LIMIT_AI_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: "Too many AI requests. Try again later." });
  },
});

/** Light global abuse ceiling (single-process memory store). */
export const globalRateLimiter = rateLimit({
  windowMs: env.CMS_RATE_LIMIT_GLOBAL_WINDOW_MS,
  limit: env.CMS_RATE_LIMIT_GLOBAL_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/ok" || req.path === "/ready",
  handler: (_req, res) => {
    res.status(429).json({ error: "Too many requests. Try again later." });
  },
});
