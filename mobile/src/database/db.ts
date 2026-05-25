import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getDatabase = () => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("briqon.db");
  }

  return dbPromise;
};
