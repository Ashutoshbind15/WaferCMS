import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import filesRouter from "./routes/files.js";
import apiKeysRouter from "./routes/api-keys.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import collectionsRouter from "./routes/collections.js";
import { contentAuthMiddleware } from "./middleware/content-auth.js";
import { sessionAuthMiddleware } from "./middleware/session-auth.js";
import { maybeBootstrapAdminFromEnv } from "./lib/bootstrap-admin.js";
import { isAiDraftsEnabled } from "./lib/ai/features.js";
import { ensureBucket } from "@packages/storage/lib";

const app = express();

const corsOrigin = process.env.CORS_ORIGIN?.trim();

app.use(express.json());
app.use(
  cors(
    corsOrigin
      ? { origin: corsOrigin, credentials: true }
      : undefined,
  ),
);
app.use(cookieParser());

app.get("/ok", (req, res) => {
  res.send("CMS Server is running");
});

app.use("/auth", authRouter);
app.use("/users", sessionAuthMiddleware, usersRouter);
app.use("/files", filesRouter);
app.use("/collections", contentAuthMiddleware, collectionsRouter);
app.use("/api-keys", sessionAuthMiddleware, apiKeysRouter);

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

  const port = Number(process.env.PORT) || 3001;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(
      `AI item drafts: ${isAiDraftsEnabled() ? "enabled" : "disabled"}`,
    );
  });
};

start().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
