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

import { parseIdParam, sendRouteError } from "../lib/http";

const safeBasename = (name: string): string => {
  const base = path.basename(name).replace(/[^\w.\-]+/g, "_");
  return base.length > 0 ? base : "file";
};

/** Parse an `isPublic` value coming from JSON or multipart (stringy) bodies. */
export const parseIsPublic = (value: unknown): boolean | null => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "1") return true;
    if (v === "false" || v === "0") return false;
  }
  return null;
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
): Promise<FileResponse> => {
  const row = await updateFileMetadata(id, { isPublic });
  return toFileResponse(row, cmsPublicBaseUrl());
};

export const listFiles = async (req: Request, res: Response) => {
  try {
    const result = await listFilesData(parseListQuery(req.query));
    res.status(200).json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const uploadFile = async (req: Request, res: Response) => {
  const file = req.file;
  if (!file?.buffer) {
    res.status(400).json({ error: 'Expected multipart field "file"' });
    return;
  }

  try {
    const result = await uploadFileData({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      isPublic: parseIsPublic(req.body.isPublic) ?? true,
    });
    res.status(201).json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const patchFile = async (req: Request, res: Response) => {
  try {
    const isPublic = parseIsPublic(req.body?.isPublic);
    if (isPublic === null) {
      res.status(400).json({ error: "isPublic must be a boolean." });
      return;
    }

    const result = await patchFileData(parseIdParam(String(req.params.id)), isPublic);
    res.status(200).json(result);
  } catch (error) {
    sendRouteError(res, error);
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
      req.socket.destroy();
    }
  });
  stream.pipe(res);
};
