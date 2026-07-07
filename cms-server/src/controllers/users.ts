import type { Request, Response } from "express";
import {
  disableUser,
  findUserByUsername,
  insertUser,
  listUsers,
} from "@packages/cms-db/users";
import { parseIdParam } from "../lib/http";
import { hashPassword } from "../lib/password";
import type { CreateUserBody } from "../lib/validation";

export const listUsersHandler = async (_req: Request, res: Response) => {
  try {
    const users = await listUsers();
    res.json({ data: users });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    res.status(500).json({ error: message });
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
    const user = await insertUser({ username: trimmedUsername, passwordHash });
    res.status(201).json(user);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    res.status(500).json({ error: message });
  }
};

export const disableUserHandler = async (req: Request, res: Response) => {
  const id = parseIdParam(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  try {
    const user = await disableUser(id);
    res.json(user);
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
