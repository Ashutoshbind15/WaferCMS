import { Router } from "express";
import {
  addBlogRecord,
  deleteBlogRecord,
  getBlog,
  listBlogs,
  updateBlogRecord,
} from "@packages/db/access";

const router: Router = Router();

router.post("/", async (req, res) => {
  const { title, blocks } = req.body;
  const result = await addBlogRecord(title, blocks);
  res.status(201).json(result);
});

router.get("/", async (req, res) => {
  const result = await listBlogs();
  res.json(result);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const result = await getBlog(parseInt(id));
  res.json(result);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, blocks } = req.body;
  const result = await updateBlogRecord(parseInt(id), title, blocks);
  res.json(result);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const result = await deleteBlogRecord(parseInt(id));
  res.status(204).json(result);
});

export default router;
