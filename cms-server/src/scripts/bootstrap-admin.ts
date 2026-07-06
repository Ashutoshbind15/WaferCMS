import "dotenv/config";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  countUsers,
  findUserByUsername,
  hashPassword,
  insertUser,
} from "@packages/cms-db/users";

const parseUsernameArg = (): string | null => {
  const index = process.argv.indexOf("--username");
  if (index === -1) {
    return null;
  }
  const value = process.argv[index + 1]?.trim();
  return value || null;
};

const readPassword = async (prompt: string): Promise<string> => {
  const rl = readline.createInterface({ input, output });
  try {
    const value = await rl.question(prompt);
    return value;
  } finally {
    rl.close();
  }
};

const main = async () => {
  const username = parseUsernameArg();
  if (!username) {
    console.error("Usage: bootstrap-admin -- --username <name>");
    process.exit(1);
  }

  const existing = await countUsers();
  if (existing > 0) {
    console.error("Users already exist. Bootstrap refused.");
    process.exit(1);
  }

  const password = await readPassword("Password: ");
  const confirm = await readPassword("Confirm password: ");

  if (!password || password !== confirm) {
    console.error("Passwords do not match or are empty.");
    process.exit(1);
  }

  const trimmedUsername = username.trim();
  if (!trimmedUsername) {
    console.error("Username is required.");
    process.exit(1);
  }

  const duplicate = await findUserByUsername(trimmedUsername);
  if (duplicate) {
    console.error("Username already exists.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const user = await insertUser({ username: trimmedUsername, passwordHash });
  console.log(`Created admin user "${user.username}" (id ${user.id}).`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
