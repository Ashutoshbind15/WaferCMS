import "dotenv/config";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

/**
 * Apply pending SQL migrations from ./drizzle.
 */
const resolveMigrationsFolder = () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [join(here, "drizzle"), join(here, "..", "drizzle")];
  for (const folder of candidates) {
    if (existsSync(join(folder, "meta", "_journal.json"))) {
      return folder;
    }
  }
  throw new Error(
    `No migrations found. Expected meta/_journal.json under ${candidates.join(" or ")}`,
  );
};

const main = async () => {
  const url = process.env.CMS_DATABASE_URL;
  if (!url) {
    throw new Error("CMS_DATABASE_URL is required to run migrations");
  }

  const migrationsFolder = resolveMigrationsFolder();
  const pool = new pg.Pool({ connectionString: url });
  const db = drizzle(pool);

  try {
    console.log(
      `Applying pending migrations from ${migrationsFolder}`,
    );
    await migrate(db, { migrationsFolder });
    console.log("Database migrations are up to date.");
  } finally {
    await pool.end();
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
