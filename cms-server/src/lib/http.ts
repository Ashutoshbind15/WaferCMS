import type { Response } from "express";
import { isStrictConfig } from "../env.js";

export const parseIdParam = (value: string): number | null => {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
};

export const sendNoContent = (res: Response) => {
  res.status(204).send();
};

export const sendCreatedId = (res: Response, id: number) => {
  res.status(201).json({ id });
};

/** Hide raw error details from clients in production/strict mode. */
export const sendServerError = (res: Response, error: unknown) => {
  if (isStrictConfig()) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
    return;
  }

  const message =
    error instanceof Error ? error.message : "Unexpected error";
  res.status(500).json({ error: message });
};
