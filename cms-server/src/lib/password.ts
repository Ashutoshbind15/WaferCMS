import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;

export const hashPassword = async (password: string): Promise<string> =>
  bcrypt.hash(password, BCRYPT_COST);

export const verifyPassword = async (
  password: string,
  passwordHash: string,
): Promise<boolean> => bcrypt.compare(password, passwordHash);
