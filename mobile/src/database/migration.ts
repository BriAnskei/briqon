import { getDatabase } from "./db";

export const migrateDatabase = async () => {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      schedule_list TEXT NOT NULL,
      temporary INTEGER NOT NULL
    );



    CREATE TABLE IF NOT EXISTS active_schedules (
      id TEXT PRIMARY KEY NOT NULL,
      schedule_id TEXT NOT NULL,
      specific_date TEXT,
      selected_days TEXT NOT NULL,
      repeat_weekly INTEGER NOT NULL,
      starts_at TEXT,
      ends_at TEXT,

      FOREIGN KEY(schedule_id)
        REFERENCES schedules(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_active_schedule_schedule_id
      ON active_schedules(schedule_id);

    CREATE INDEX IF NOT EXISTS idx_specific_date
      ON active_schedules(specific_date);
  `);
};
