import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * The drizzle instance must be a real object at import time — Auth.js's adapter
 * inspects its type via `instanceof`. postgres.js does not open a connection
 * until the first query, so building the app without a database is safe.
 *
 * A missing DATABASE_URL yields a placeholder that fails loudly on first query
 * instead of crashing every page module at build time.
 */
const url =
  process.env.DATABASE_URL ?? "postgres://missing-env-set-DATABASE_URL@127.0.0.1:5432/missing";

const globalForDb = globalThis as unknown as { __climbSql?: ReturnType<typeof postgres> };
const client = globalForDb.__climbSql ?? postgres(url, { max: 10 });
globalForDb.__climbSql = client;

export const db = drizzle(client, { schema });
export { client, schema };
