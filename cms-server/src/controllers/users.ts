import type { Request, Response } from "express";
import {
  disableUser,
  findUserByUsername,
  insertUser,
  listUsers,
} from "@packages/cms-db/users";
import { hashPassword } from "better-auth/crypto";
import { sendNoContent, sendServerError } from "../lib/http.js";
import type { CreateUserBody } from "../lib/validation.js";

export const listUsersHandler = async (_req: Request, res: Response) => {
  try {
    const users = await listUsers();
    res.json({ data: users });
  } catch (error) {
    sendServerError(res, error);
  }
};

export const createUserHandler = async (req: Request, res: Response) => {
  const { username, password } = req.body as CreateUserBody;
  const trimmedUsername = username.trim();

  const existing = await findUserByUsername(trimmedUsername);
  if (existing) {
    res.status(400).json({ error: "Username already exists." });
    return;
  }

  try {
    const passwordHash = await hashPassword(password);
    await insertUser({ username: trimmedUsername, passwordHash });
    sendNoContent(res);
  } catch (error) {
    sendServerError(res, error);
  }
};

export const disableUserHandler = async (req: Request, res: Response) => {
  const id = String(req.params.id ?? "").trim();
  if (!id) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  try {
    await disableUser(id);
    sendNoContent(res);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    if (message.endsWith("not found.")) {
      res.status(404).json({ error: message });
      return;
    }
    sendServerError(res, error);
  }
};
