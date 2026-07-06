import type { NextFunction, Request, Response } from "express";
import { type ZodType } from "zod";

export const validateBody =
  <T extends ZodType>(schema: T) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message =
        result.error.issues[0]?.message ?? "Invalid request body.";
      res.status(400).json({ error: message });
      return;
    }

    req.body = result.data;
    next();
  };
