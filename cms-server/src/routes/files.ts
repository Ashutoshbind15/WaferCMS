import { Router } from "express";
import multer from "multer";
import {
  listFiles,
  patchFile,
  streamFile,
  uploadFile,
} from "../controllers/files.js";
import { contentAuthMiddleware } from "../middleware/content-auth.js";
import { fileAccessAuth } from "../middleware/file-access-auth.js";
import { validateBody } from "../middleware/validate-body.js";
import {
  patchFileBodySchema,
  uploadFileBodySchema,
} from "../lib/validation.js";

const upload = multer({ storage: multer.memoryStorage() });

const router: Router = Router();

router.get("/", contentAuthMiddleware, listFiles);
router.post(
  "/",
  contentAuthMiddleware,
  upload.single("file"),
  validateBody(uploadFileBodySchema),
  uploadFile,
);
router.patch(
  "/:id",
  contentAuthMiddleware,
  validateBody(patchFileBodySchema),
  patchFile,
);
router.get("/:id", fileAccessAuth, streamFile);

export default router;
