import { Router } from "express";
import type { Readable } from "node:stream";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  getFileMetadataById,
  insertFileMetadata,
  listFileMetadata,
  toFileResponse,
  updateFileMetadata,
} from "@packages/cms-db/access";
import { getObject, putObject } from "@packages/storage/lib";
import { parseListQuery } from "../lib/pagination";
import { cmsPublicBaseUrl } from "../lib/asset-url";
import { parseIdParam, sendRouteError } from "../lib/http";
import { contentAuthMiddleware } from "../middleware/content-auth";
import { fileAccessAuth } from "../middleware/file-access-auth";

const upload = multer({ storage: multer.memoryStorage() });

const router: Router = Router();

function safeBasename(name: string): string {
  const base = path.basename(name).replace(/[^\w.\-]+/g, "_");
  return base.length > 0 ? base : "file";
}

/** Parse an `isPublic` value coming from JSON or multipart (stringy) bodies. */
function parseIsPublic(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "1") return true;
    if (v === "false" || v === "0") return false;
  }
  return null;
}

router.get("/", contentAuthMiddleware, async (req, res) => {
  try {
    const result = await listFileMetadata(parseListQuery(req.query));
    const baseUrl = cmsPublicBaseUrl();
    res.status(200).json({
      data: result.data.map((row) => toFileResponse(row, baseUrl)),
      pagination: result.pagination,
    });
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.post("/", contentAuthMiddleware, upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file?.buffer) {
    res.status(400).json({ error: 'Expected multipart field "file"' });
    return;
  }

  const originalFilename = safeBasename(file.originalname);
  const objectKey = `${randomUUID()}-${originalFilename}`;
  const contentType = file.mimetype || null;
  // Default to public on upload; multipart fields arrive as strings.
  const isPublic = parseIsPublic(req.body.isPublic) ?? true;

  await putObject({
    key: objectKey,
    body: file.buffer,
    contentType: contentType ?? undefined,
  });

  const row = await insertFileMetadata({
    objectKey,
    originalFilename,
    contentType,
    byteLength: file.buffer.length,
    isPublic,
  });

  res.status(201).json(toFileResponse(row, cmsPublicBaseUrl()));
});

router.patch("/:id", contentAuthMiddleware, async (req, res) => {
  try {
    const isPublic = parseIsPublic(req.body?.isPublic);
    if (isPublic === null) {
      res.status(400).json({ error: "isPublic must be a boolean." });
      return;
    }

    const row = await updateFileMetadata(parseIdParam(String(req.params.id)), {
      isPublic,
    });
    res.status(200).json(toFileResponse(row, cmsPublicBaseUrl()));
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.get("/:id", fileAccessAuth, async (req, res) => {
  const row = req.fileMetadata;
  if (!row) {
    res.status(404).json({ error: "File not found." });
    return;
  }

  const download = req.query.download === "1" || req.query.download === "true";
  const isImage = row.contentType?.startsWith("image/") ?? false;

  let object;
  try {
    object = await getObject({
      key: row.objectKey,
      range: typeof req.headers.range === "string" ? req.headers.range : undefined,
    });
  } catch (error) {
    sendRouteError(res, error);
    return;
  }

  res.status(object.statusCode);
  res.set("Content-Type", row.contentType || object.contentType || "application/octet-stream");
  if (object.contentLength !== undefined) {
    res.set("Content-Length", String(object.contentLength));
  }
  if (object.contentRange) {
    res.set("Content-Range", object.contentRange);
  }
  if (object.etag) {
    res.set("ETag", object.etag);
  }
  if (object.lastModified) {
    res.set("Last-Modified", object.lastModified.toUTCString());
  }
  res.set(
    "Cache-Control",
    row.isPublic
      ? "public, max-age=31536000, immutable"
      : "private, no-store",
  );
  res.set(
    "Content-Disposition",
    download
      ? `attachment; filename="${encodeURIComponent(row.originalFilename)}"`
      : isImage
        ? "inline"
        : `inline; filename="${encodeURIComponent(row.originalFilename)}"`,
  );

  const stream = object.body as Readable;
  stream.on("error", (err) => {
    if (!res.headersSent) {
      sendRouteError(res, err);
    } else {
      // Headers already flushed — best we can do is destroy the connection.
      req.socket.destroy();
    }
  });
  stream.pipe(res);
});

export default router;
