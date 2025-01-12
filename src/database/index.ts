// import { SqliteDatabaseAdapter } from "@elizaos/adapter-sqlite";
// import Database from "better-sqlite3";
// import path from "path";
import PostgresDatabaseAdapter from "../adapter-postgres/src";

export function initializeDatabase(dataDir: string) {
  if (process.env.POSTGRES_URL) {
    const adapter = new PostgresDatabaseAdapter({
      connectionString: process.env.POSTGRES_URL,
    });
    return adapter;
  }
  // }
  // else {
  //   // const filePath =
  //   //   process.env.SQLITE_FILE ?? path.resolve(dataDir, "adapter.sqlite");
  //   // // ":memory:";
  //   // const adapter = new SqliteDatabaseAdapter(new Database(filePath));
  //   // return adapter;
  // }
  throw new Error("POSTGRES_URL is not set");
}
