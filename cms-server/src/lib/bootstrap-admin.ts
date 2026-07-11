import { insertFirstUserIfEmpty } from "@packages/cms-db/users";
import { hashPassword } from "./password.js";

export const createFirstAdmin = async (input: {
  username: string;
  password: string;
}): Promise<{ id: number; username: string } | null> => {
  const username = input.username.trim();
  if (!username) {
    throw new Error("Username is required.");
  }
  if (!input.password) {
    throw new Error("Password is required.");
  }

  const passwordHash = await hashPassword(input.password);
  return insertFirstUserIfEmpty({ username, passwordHash });
};

/**
 * One-shot deploy bootstrap from env. Idempotent: no-ops when users exist
 * or when env vars are unset. Logs clearly; does not throw on "already done".
 */
export const maybeBootstrapAdminFromEnv = async (): Promise<void> => {
  const username = process.env.CMS_BOOTSTRAP_ADMIN_USERNAME?.trim() ?? "";
  const password = process.env.CMS_BOOTSTRAP_ADMIN_PASSWORD ?? "";

  if (!username && !password) {
    return;
  }

  if (!username || !password) {
    console.warn(
      "CMS_BOOTSTRAP_ADMIN_USERNAME and CMS_BOOTSTRAP_ADMIN_PASSWORD must both be set; skipping bootstrap.",
    );
    return;
  }

  const created = await createFirstAdmin({ username, password });
  if (created) {
    console.log(
      `Bootstrapped admin user "${created.username}" (id ${created.id}) from env.`,
    );
    return;
  }

  console.log(
    "CMS_BOOTSTRAP_ADMIN_* set but users already exist; bootstrap skipped.",
  );
};
