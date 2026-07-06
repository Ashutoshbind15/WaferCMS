import type { Request, Response } from "express";
import {
  disableUser,
  findUserByUsername,
  hashPassword,
  insertUser,
  listUsers,
} from "@packages/cms-db/users";
import { parseIdParam, sendRouteError } from "../lib/http";
import type { CreateUserBody } from "../lib/validation";

const listUsersData = async () => listUsers();

const createUserData = async (input: CreateUserBody) => {
  const username = input.username.trim();

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
    const user = await createUserData(req.body as CreateUserBody);
    res.status(201).json(user);
  } catch (error) {
    sendRouteError(res, error);
  }
};

export const disableUserHandler = async (req: Request, res: Response) => {
  try {
    const user = await disableUserData(parseIdParam(String(req.params.id)));
    res.json(user);
  } catch (error) {
    sendRouteError(res, error);
  }
};
