import { Router } from "express";
import multer from "multer";
import {
  listFiles,
  patchFile,
  streamFile,
  uploadFile,
} from "../controllers/files";
import { contentAuthMiddleware } from "../middleware/content-auth";
import { fileAccessAuth } from "../middleware/file-access-auth";

const upload = multer({ storage: multer.memoryStorage() });

const router: Router = Router();

router.get("/", contentAuthMiddleware, listFiles);
router.post("/", contentAuthMiddleware, upload.single("file"), uploadFile);
router.patch("/:id", contentAuthMiddleware, patchFile);
router.get("/:id", fileAccessAuth, streamFile);

export default router;
