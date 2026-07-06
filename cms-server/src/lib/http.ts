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

  if (
    message === "Invalid id." ||
    message === "Title is required." ||
    message === "Label is required." ||
    message === "Slug is required." ||
    message === "Field key is required." ||
    message === "Field label is required." ||
    message === "values object is required." ||
    message.startsWith("Slug must start with a letter") ||
    message.startsWith("Field key must start with a letter") ||
    message.startsWith("Field type must be one of:") ||
    message.startsWith("Item value for field") ||
    message.startsWith("Unknown field key")
  ) {
    res.status(400).json({ error: message });
    return;
  }

  if (message.startsWith("API key ") && message.endsWith(" not found.")) {
    res.status(404).json({ error: message });
    return;
  }

  if (message.startsWith("User ") && message.endsWith(" not found.")) {
    res.status(404).json({ error: message });
    return;
  }

  if (
    message === "Username is required." ||
    message === "Password is required." ||
    message === "Users already exist." ||
    message === "Username already exists."
  ) {
    res.status(400).json({ error: message });
    return;
  }

  if (message === "Invalid page." || message === "Invalid limit.") {
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
