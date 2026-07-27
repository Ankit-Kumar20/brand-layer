import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env (see .env.example) and restart the dev server.",
  );
}

const globalForDb = globalThis as unknown as {
  postgresClient: ReturnType<typeof postgres> | undefined;
  postgresUrl: string | undefined;
};

// Recreate the client if the URL changed (common after editing .env without a clean restart).
if (
  globalForDb.postgresClient &&
  globalForDb.postgresUrl !== connectionString
) {
  void globalForDb.postgresClient.end({ timeout: 1 });
  globalForDb.postgresClient = undefined;
}

const client =
  globalForDb.postgresClient ??
  postgres(connectionString, {
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = client;
  globalForDb.postgresUrl = connectionString;
}

export const db = drizzle(client, { schema });
