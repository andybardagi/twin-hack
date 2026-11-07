import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/lib/db/schema";

let db: NodePgDatabase<typeof schema> | undefined;

export function getDb(): NodePgDatabase<typeof schema> {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("Set DATABASE_URL before calling getDb(). See docs/conventions.md.");
    }

    db = drizzle({ client: new Pool({ connectionString }), schema });
  }

  return db;
}
