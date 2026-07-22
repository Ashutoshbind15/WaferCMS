import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { MulterError } from "multer";
import { toNodeHandler } from "better-auth/node";
import { pingDb } from "@packages/cms-db/db";
import { ensureBucket, headBucket } from "@packages/storage/lib";
import { env } from "./env.js";
import filesRouter from "./routes/files.js";
import apiKeysRouter from "./routes/api-keys.js";
import usersRouter from "./routes/users.js";
import collectionsRouter from "./routes/collections.js";
import aiRouter from "./routes/ai.js";
import { contentAuthMiddleware } from "./middleware/content-auth.js";
import { sessionAuthMiddleware } from "./middleware/session-auth.js";
import { sessionOriginGuard } from "./middleware/session-origin.js";
import {
  aiRateLimiter,
  globalRateLimiter,
  loginRateLimiter,
} from "./middleware/rate-limits.js";
import { maybeBootstrapAdminFromEnv } from "./lib/bootstrap-admin.js";
import { isAiAgentEnabled, isAiDraftsEnabled } from "./lib/ai/features.js";
import { auth } from "./lib/auth.js";
import { sendServerError } from "./lib/http.js";

const app = express();

if (env.CMS_TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

const corsOrigin = env.CORS_ORIGIN;

app.use(
  cors(
    corsOrigin
      ? { origin: corsOrigin, credentials: true }
      : undefined,
  ),
);

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

app.use(globalRateLimiter);
app.use(sessionOriginGuard);

// Better Auth must run before express.json() — it parses its own body.
app.use("/auth/sign-in", loginRateLimiter);
app.all("/auth/{*any}", toNodeHandler(auth));

app.use(express.json());
app.use(cookieParser());

app.get("/ok", (_req, res) => {
  res.send("CMS Server is running");
});

app.get("/ready", async (_req, res) => {
  try {
    await pingDb();
    await headBucket();
    res.status(200).json({ ready: true });
  } catch (error) {
    console.error("Readiness check failed:", error);
    res.status(503).json({ ready: false });
  }
});

app.use("/users", sessionAuthMiddleware, usersRouter);
app.use("/files", filesRouter);
app.use("/collections", contentAuthMiddleware, collectionsRouter);
app.use("/api-keys", sessionAuthMiddleware, apiKeysRouter);
if (isAiAgentEnabled()) {
  app.use("/ai", sessionAuthMiddleware, aiRateLimiter, aiRouter);
}

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error instanceof MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "File too large." });
      return;
    }

    sendServerError(res, error);
  },
);

const start = async () => {
  await maybeBootstrapAdminFromEnv();
  await ensureBucket();

  if (
    isAiDraftsEnabled() &&
    !process.env.OPENROUTER_API_KEY?.trim()
  ) {
    throw new Error(
      "CMS_AI_DRAFTS_ENABLED is true but OPENROUTER_API_KEY is not configured.",
    );
  }

  if (
    isAiAgentEnabled() &&
    !process.env.OPENROUTER_API_KEY?.trim()
  ) {
    throw new Error(
      "CMS_AI_AGENT_ENABLED is true but OPENROUTER_API_KEY is not configured.",
    );
  }

  const port = Number(process.env.PORT) || 3001;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(
      `AI item drafts: ${isAiDraftsEnabled() ? "enabled" : "disabled"}`,
    );
    console.log(
      `AI task agent: ${isAiAgentEnabled() ? "enabled" : "disabled"}`,
    );
  });
};

start().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
