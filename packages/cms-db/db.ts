import { drizzle } from "drizzle-orm/node-postgres";

const db = drizzle(process.env.CMS_DATABASE_URL!);

export default db;
