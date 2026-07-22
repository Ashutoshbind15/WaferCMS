import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.CMS_DATABASE_URL!);

export const pingDb = async (): Promise<void> => {
  await db.execute(sql`select 1`);
};

export default db;
