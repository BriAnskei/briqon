import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("briqon.db");

export function initDb() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS active_schedules (
      id TEXT PRIMARY KEY,
      schedule_items TEXT NOT NULL,   -- JSON
      date_mode TEXT NOT NULL,
      start_day INTEGER,
      end_day INTEGER,
      specific_date TEXT,
      recurring INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export default db;
