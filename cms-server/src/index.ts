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

app.listen(Number(process.env.PORT) || 3001, () => {
  console.log(`Server is running on port ${process.env.PORT || 3001}`);
});
