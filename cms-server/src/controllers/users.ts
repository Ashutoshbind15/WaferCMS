import type { Request, Response } from "express";
import {
  disableUser,
  findUserByUsername,
  hashPassword,
  insertUser,
  listUsers,
} from "@packages/cms-db/users";
import { isNonEmptyString } from "../lib/validation";
import { parseIdParam, sendRouteError } from "../lib/http";

const listUsersData = async () => listUsers();

const createUserData = async (input: { username: string; password: string }) => {
  const username = input.username.trim();
  if (!username) {
    throw new Error("Username is required.");
  }
  if (!input.password) {
    throw new Error("Password is required.");
  }

  const existing = await findUserByUsername(username);
  if (existing) {
    throw new Error("Username already exists.");
  }

  const passwordHash = await hashPassword(input.password);
  return insertUser({ username, passwordHash });
};

const disableUserData = async (id: number) => disableUser(id);

export const listUsersHandler = async (_req: Request, res: Response) => {
  try {
    const users = await listUsersData();
    res.json({ data: users });
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const createUserHandler = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as {
      username?: unknown;
      password?: unknown;
    };

    if (!isNonEmptyString(username)) {
      res.status(400).json({ error: "Username is required." });
      return;
    }

    if (typeof password !== "string" || !password) {
      res.status(400).json({ error: "Password is required." });
      return;
    }

    const user = await createUserData({ username, password });
    res.status(201).json(user);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const disableUserHandler = async (req: Request, res: Response) => {
  try {
    const { enabled } = req.body as { enabled?: unknown };

    if (enabled !== false) {
      res.status(400).json({ error: "Only disabling users is supported." });
      return;
    }

    const user = await disableUserData(parseIdParam(String(req.params.id)));
    res.json(user);
  } catch (error) {
    sendRouteError(res, error);
  }
};
