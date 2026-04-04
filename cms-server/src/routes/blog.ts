import { Router } from "express";
import {
  addBlogRecord,
  deleteBlogRecord,
  getBlog,
  listBlogs,
  updateBlogRecord,
} from "@packages/db/access";
import { parseIdParam, sendRouteError } from "../lib/http";

const router: Router = Router();

router.post("/", async (req, res) => {
  try {
    const { title, blocks } = req.body;
    const result = await addBlogRecord(title, blocks);
    res.status(201).json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await listBlogs();
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const result = await getBlog(id);
    if (!result) {
      res.status(404).json({ error: `Blog ${id} not found.` });
      return;
    }
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { title, blocks } = req.body;
    const result = await updateBlogRecord(
      parseIdParam(req.params.id),
      title,
      blocks,
    );
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteBlogRecord(parseIdParam(req.params.id));
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

export default router;
