import PostgresDatabaseAdapter from "../adapter-postgres/src";

export function initializeDatabase() {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not set");
  }

  const adapter = new PostgresDatabaseAdapter({
    connectionString: process.env.POSTGRES_URL,
  });
  return adapter;
}
