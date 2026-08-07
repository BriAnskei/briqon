import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getDatabase = () => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync("briqon.db");

      await db.execAsync(`
        PRAGMA foreign_keys = ON;
				PRAGMA journal_mode = WAL;
        `);

      return db;
    })();
  }

  return dbPromise;
};
