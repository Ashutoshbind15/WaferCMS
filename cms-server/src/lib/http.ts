import type { Response } from "express";

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
