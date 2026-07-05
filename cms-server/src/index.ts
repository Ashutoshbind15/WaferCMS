import "dotenv/config";
import express from "express";
import cors from "cors";
import contentRouter from "./routes/content";
import diagramsRouter from "./routes/diagrams";
import filesRouter from "./routes/files";
import apiKeysRouter from "./routes/api-keys";
import { apiKeyAuthMiddleware } from "./middleware/api-key-auth";

const app = express();

app.set("trust proxy", 1);
app.use(express.json());
app.use(cors());

app.get("/ok", (req, res) => {
  res.send("CMS Server is running");
});

app.use(apiKeyAuthMiddleware);

app.use("/content", contentRouter);
app.use("/diagrams", diagramsRouter);
app.use("/files", filesRouter);
app.use("/api-keys", apiKeysRouter);

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
