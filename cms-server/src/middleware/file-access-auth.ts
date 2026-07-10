import type { NextFunction, Request, Response } from "express";
import type { FileMetadataRow } from "@packages/cms-db/access";
import { getFileMetadataById } from "@packages/cms-db/access";
import { parseIdParam } from "../lib/http.js";
import { trySessionAuth, type SessionAuthContext } from "./session-auth.js";
import {
  apiKeyAuthRequired,
  tryApiKeyAuth,
  type ApiKeyAuthContext,
} from "./api-key-auth.js";

declare global {
  namespace Express {
    interface Request {
      fileMetadata?: FileMetadataRow;
    }
  }
}

/**
 * Auth for `GET /files/:id` (asset bytes).
 *
 *   1. Load the file row by id → 404 if missing.
 *   2. Public files: attach `req.fileMetadata` and pass through (no auth).
 *   3. Private files: require a valid session cookie **or** a bearer API key
 *      with read scope. When `CMS_REQUIRE_API_KEY=false` (local dev), mirror
 *      `contentAuthMiddleware` and let private requests through without a key.
 */
export const fileAccessAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = parseIdParam(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  const row = await getFileMetadataById(id);
  if (!row) {
    res.status(404).json({ error: `File ${id} not found.` });
    return;
  }

  req.fileMetadata = row;

  if (row.isPublic) {
    next();
    return;
  }

  const session: SessionAuthContext | null = await trySessionAuth(req);
  if (session) {
    req.sessionAuth = session;
    next();
    return;
  }

  if (!apiKeyAuthRequired()) {
    next();
    return;
  }

  const apiKey: ApiKeyAuthContext | null = await tryApiKeyAuth(req);
  if (apiKey) {
    req.apiKeyAuth = apiKey;
    next();
    return;
  }

  res.status(401).json({ error: "Unauthorized." });
};
