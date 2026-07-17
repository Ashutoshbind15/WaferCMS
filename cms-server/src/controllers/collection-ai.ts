import type { Request, Response } from "express";
import {
  getCollectionRecord,
  listCollectionFieldRecords,
} from "@packages/cms-db/collections";
import { generateItemDraft } from "../lib/ai/draft-item.js";
import { parseIdParam } from "../lib/http.js";
import { isItemValidationError } from "../lib/item-values.js";
import type { AiDraftBody } from "../lib/validation.js";

const parseCollectionId = (req: Request) =>
  parseIdParam(String(req.params.collectionId));

export const draftItem = async (req: Request, res: Response) => {
  if (!req.sessionAuth) {
    res.status(401).json({
      error: "AI draft requires an admin session. Sign in via the CMS UI.",
    });
    return;
  }

  const collectionId = parseCollectionId(req);
  if (collectionId === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  const collection = await getCollectionRecord(collectionId);
  if (!collection) {
    res
      .status(404)
      .json({ error: `Collection ${req.params.collectionId} not found.` });
    return;
  }

  const fields = await listCollectionFieldRecords(collectionId);
  if (fields.length === 0) {
    res.status(400).json({
      error: "This collection has no fields defined.",
    });
    return;
  }

  const body = req.body as AiDraftBody;

  try {
    const result = await generateItemDraft({
      collection: {
        title: collection.title,
        description: collection.description,
      },
      fields,
      prompt: body.prompt,
      model: body.model,
    });
    res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";

    if (
      message.includes("no AI-generatable fields") ||
      isItemValidationError(message)
    ) {
      res.status(400).json({ error: message });
      return;
    }

    console.error("AI draft failed:", error);
    res.status(502).json({
      error: message.startsWith("Model ")
        ? message
        : "Failed to generate draft from the model.",
    });
  }
};
