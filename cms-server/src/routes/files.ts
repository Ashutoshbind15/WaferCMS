import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { insertFileMetadata, listFileMetadata } from "@packages/db/access";
import { putObject } from "@packages/storage/lib";

const upload = multer({ storage: multer.memoryStorage() });

const router: Router = Router();

function safeBasename(name: string): string {
  const base = path.basename(name).replace(/[^\w.\-]+/g, "_");
  return base.length > 0 ? base : "file";
}

/** Base URL where objects are reachable (no trailing slash), e.g. CDN or https://rustfs.example/bucket. */
function publicObjectUrl(objectKey: string): string {
  const base = process.env.RUSTFS_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("RUSTFS_PUBLIC_BASE_URL is not set");
  }
  const pathPart = objectKey.split("/").map(encodeURIComponent).join("/");
  return `${base}/${pathPart}`;
}

router.get("/", async (_req, res) => {
  const rows = await listFileMetadata();
  res.status(200).json(rows);
});

router.post("/", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file?.buffer) {
    res.status(400).json({ error: 'Expected multipart field "file"' });
    return;
  }

  const originalFilename = safeBasename(file.originalname);
  const objectKey = `${randomUUID()}-${originalFilename}`;
  const contentType = file.mimetype || null;

  await putObject({
    key: objectKey,
    body: file.buffer,
    contentType: contentType ?? undefined,
  });

  let publicUrl: string;
  try {
    publicUrl = publicObjectUrl(objectKey);
  } catch (e) {
    res.status(500).json({
      error:
        e instanceof Error ? e.message : "Could not build public object URL",
    });
    return;
  }

  const row = await insertFileMetadata({
    objectKey,
    publicUrl,
    originalFilename,
    contentType,
    byteLength: file.buffer.length,
  });

  res.status(201).json(row);
});

export default router;
