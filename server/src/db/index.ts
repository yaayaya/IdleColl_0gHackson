import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgres://postgres:idlecoll_secret@localhost:5432/idlecoll";

const pool = new pg.Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });
export { pool };
