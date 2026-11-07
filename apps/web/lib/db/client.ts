import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";

import * as schema from "@/lib/db/schema";

let db: NodePgDatabase<typeof schema> | undefined;

export function getDb(): NodePgDatabase<typeof schema> {
  if (!db) {
    const environment = z.object({ DATABASE_URL: z.url() }).safeParse(process.env);
    if (!environment.success) {
      throw new Error("Set DATABASE_URL before calling getDb(). See docs/conventions.md.");
    }
    const connectionString = environment.data.DATABASE_URL;
    const pool = new Pool({ connectionString });

    // pg discards failed idle clients; handling the event keeps the process alive.
    pool.on("error", (error) => console.error("Idle Postgres connection failed", error));
    db = drizzle({ client: pool, schema });
  }

  return db;
}
