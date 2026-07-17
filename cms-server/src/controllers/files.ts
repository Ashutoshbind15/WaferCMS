import type { Request, Response } from "express";
import type { Readable } from "node:stream";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import {
  getFileMetadataById,
  insertFileMetadata,
  listFileMetadata,
  updateFileMetadata,
  type FileMetadataRow,
} from "@packages/cms-db/access";
import { getObject, getObjectBuffer, putObject } from "@packages/storage/lib";
import { type ListPageQuery, type PaginatedRows } from "@packages/cms-db/pagination";
import { parseListQuery } from "../lib/pagination.js";
import { cmsPublicBaseUrl } from "../lib/asset-url.js";
import { toFileResponse, type FileResponse } from "../lib/files.js";
import { parseIdParam, sendNoContent } from "../lib/http.js";
import type { PatchFileBody, UploadFileBody } from "../lib/validation.js";
import { imageMaxBytes } from "../lib/image-config.js";
import {
  parseImageTransformQuery,
} from "../lib/image-transform-params.js";
import { transformImage } from "../lib/image-transform.js";

const safeBasename = (name: string): string => {
  const base = path.basename(name).replace(/[^\w.\-]+/g, "_");
  return base.length > 0 ? base : "file";
};

const listFilesData = async (
  query: ListPageQuery,
): Promise<PaginatedRows<FileResponse>> => {
  const result = await listFileMetadata(query);
  const baseUrl = cmsPublicBaseUrl();
  return {
    data: result.data.map((row) => toFileResponse(row, baseUrl)),
    pagination: result.pagination,
  };
};

type UploadInput = {
  buffer: Buffer;
  originalname: string;
  mimetype: string | undefined;
  isPublic: boolean;
};

const uploadFileData = async (input: UploadInput): Promise<FileResponse> => {
  const originalFilename = safeBasename(input.originalname);
  const objectKey = `${randomUUID()}-${originalFilename}`;
  const contentType = input.mimetype || null;

  await putObject({
    key: objectKey,
    body: input.buffer,
    contentType: contentType ?? undefined,
  });

  const row = await insertFileMetadata({
    objectKey,
    originalFilename,
    contentType,
    byteLength: input.buffer.length,
    isPublic: input.isPublic,
  });

  return toFileResponse(row, cmsPublicBaseUrl());
};

const patchFileData = async (
  id: number,
  isPublic: boolean,
): Promise<void> => {
  await updateFileMetadata(id, { isPublic });
};

export const listFiles = async (req: Request, res: Response) => {
  let query: ListPageQuery;
  try {
    query = parseListQuery(req.query);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    res.status(400).json({ error: message });
    return;
  }

  try {
    const result = await listFilesData(query);
    res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    res.status(500).json({ error: message });
  }
};

export const uploadFile = async (req: Request, res: Response) => {
  const file = req.file;
  if (!file?.buffer) {
    res.status(400).json({ error: 'Expected multipart field "file"' });
    return;
  }

  try {
    const { isPublic } = req.body as UploadFileBody;
    const created = await uploadFileData({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      isPublic,
    });
    res.status(201).json(created);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    res.status(500).json({ error: message });
  }
};

export const patchFile = async (req: Request, res: Response) => {
  const id = parseIdParam(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  const { isPublic } = req.body as PatchFileBody;
  try {
    await patchFileData(id, isPublic);
    sendNoContent(res);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    if (message.endsWith("not found.")) {
      res.status(404).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
};

export const getFileMeta = async (req: Request, res: Response) => {
  const id = parseIdParam(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  try {
    const row = await getFileMetadataById(id);
    if (!row) {
      res.status(404).json({ error: `File ${id} not found.` });
      return;
    }
    res.status(200).json(toFileResponse(row, cmsPublicBaseUrl()));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    res.status(500).json({ error: message });
  }
};

export const streamFile = async (req: Request, res: Response) => {
  const row = req.fileMetadata as FileMetadataRow | undefined;
  if (!row) {
    res.status(404).json({ error: "File not found." });
    return;
  }

  const download = req.query.download === "1" || req.query.download === "true";
  const isImage = row.contentType?.startsWith("image/") ?? false;

  if (!download && isImage) {
    try {
      const params = parseImageTransformQuery(req.query);
      if (params !== null) {
        await streamTransformedImage(req, res, row, params);
        return;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error";
      res.status(400).json({ error: message });
      return;
    }
  }

  await streamOriginalFile(req, res, row, download, isImage);
};

const streamTransformedImage = async (
  _req: Request,
  res: Response,
  row: FileMetadataRow,
  params: Parameters<typeof transformImage>[1],
) => {
  if (row.byteLength > imageMaxBytes()) {
    res.status(413).json({ error: "Image too large to transform." });
    return;
  }

  let fetched;
  try {
    fetched = await getObjectBuffer({ key: row.objectKey });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    res.status(500).json({ error: message });
    return;
  }

  let transformed;
  try {
    transformed = await transformImage(fetched.buffer, params, row.contentType ?? null);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    res.status(422).json({ error: message });
    return;
  }

  const etag = `"${createHash("sha1")
    .update(`${row.id}:${row.objectKey}:${transformed.contentType}:${transformed.buffer.length}`)
    .digest("hex")}"`;

  res.status(200);
  res.set("Content-Type", transformed.contentType);
  res.set("Content-Length", String(transformed.buffer.length));
  res.set("ETag", etag);
  res.set(
    "Cache-Control",
    row.isPublic
      ? "public, max-age=31536000, immutable"
      : "private, no-store",
  );
  res.set("Content-Disposition", "inline");
  res.send(transformed.buffer);
};

const streamOriginalFile = async (
  req: Request,
  res: Response,
  row: FileMetadataRow,
  download: boolean,
  isImage: boolean,
) => {
  let object;
  try {
    object = await getObject({
      key: row.objectKey,
      range: typeof req.headers.range === "string" ? req.headers.range : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    res.status(500).json({ error: message });
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
      const message = err instanceof Error ? err.message : "Unexpected error";
      res.status(500).json({ error: message });
    } else {
      req.socket.destroy();
    }
  });
  stream.pipe(res);
};
