import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import contentRouter from "./routes/content";
import diagramsRouter from "./routes/diagrams";
import filesRouter from "./routes/files";
import apiKeysRouter from "./routes/api-keys";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import collectionsRouter from "./routes/collections";
import { contentAuthMiddleware } from "./middleware/content-auth";
import { sessionAuthMiddleware } from "./middleware/session-auth";

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
app.use("/content", contentAuthMiddleware, contentRouter);
app.use("/diagrams", contentAuthMiddleware, diagramsRouter);
app.use("/files", filesRouter);
app.use("/collections", contentAuthMiddleware, collectionsRouter);
app.use("/api-keys", sessionAuthMiddleware, apiKeysRouter);

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
