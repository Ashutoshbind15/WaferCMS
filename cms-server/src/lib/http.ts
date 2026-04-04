import type { Response } from "express";

export const parseIdParam = (value: string): number => {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid id.");
  }
  return id;
};

export const sendRouteError = (res: Response, error: unknown) => {
  const message = error instanceof Error ? error.message : "Unexpected error";

  if (message === "Invalid id." || message === "Title is required.") {
    res.status(400).json({ error: message });
    return;
  }

  if (message.includes("must include a valid type and refId")) {
    res.status(400).json({ error: message });
    return;
  }

  if (message.endsWith("not found.")) {
    res.status(404).json({ error: message });
    return;
  }

  res.status(500).json({ error: message });
};
