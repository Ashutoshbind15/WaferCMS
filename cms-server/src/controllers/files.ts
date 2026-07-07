import type { Request, Response } from "express";
import type { Readable } from "node:stream";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  insertFileMetadata,
  listFileMetadata,
  updateFileMetadata,
  type FileMetadataRow,
} from "@packages/cms-db/access";
import { getObject, putObject } from "@packages/storage/lib";
import { type ListPageQuery, type PaginatedRows } from "@packages/cms-db/pagination";
import { parseListQuery } from "../lib/pagination";
import { cmsPublicBaseUrl } from "../lib/asset-url";
import { toFileResponse, type FileResponse } from "../lib/files";
import { parseIdParam, sendNoContent } from "../lib/http";
import type { PatchFileBody, UploadFileBody } from "../lib/validation";

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

const uploadFileData = async (input: UploadInput): Promise<void> => {
  const originalFilename = safeBasename(input.originalname);
  const objectKey = `${randomUUID()}-${originalFilename}`;
  const contentType = input.mimetype || null;

  await putObject({
    key: objectKey,
    body: input.buffer,
    contentType: contentType ?? undefined,
  });

  await insertFileMetadata({
    objectKey,
    originalFilename,
    contentType,
    byteLength: input.buffer.length,
    isPublic: input.isPublic,
  });
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
    await uploadFileData({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      isPublic,
    });
    sendNoContent(res);
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

export const streamFile = async (req: Request, res: Response) => {
  const row = req.fileMetadata as FileMetadataRow | undefined;
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
