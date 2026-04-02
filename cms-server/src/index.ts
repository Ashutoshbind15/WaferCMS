import "dotenv/config";
import express from "express";
import cors from "cors";
import blogRouter from "./routes/blog.js";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/ok", (req, res) => {
  res.send("CMS Server is running");
});

app.use("/blog", blogRouter);

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
