import { getDatabase } from "./db";

export const migrateDatabase = async () => {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
   


    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      schedule_list TEXT NOT NULL,
      temporary INTEGER NOT NULL
    );

   
    CREATE TABLE IF NOT EXISTS active_schedules (
      id TEXT PRIMARY KEY NOT NULL,
      schedule_id TEXT NOT NULL,
      active_type TEXT NOT NULL,
      recurring INTEGER NOT NULL,
      starts_at TEXT,
      ends_at TEXT,

      FOREIGN KEY (schedule_id)
        REFERENCES schedules(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_active_schedules_schedule_id
      ON active_schedules(schedule_id);


    CREATE TABLE IF NOT EXISTS active_schedule_days (
      id TEXT PRIMARY KEY NOT NULL,
      active_schedule_id TEXT NOT NULL,
      weekday INTEGER NOT NULL,

      FOREIGN KEY (active_schedule_id)
        REFERENCES active_schedules(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_active_schedule_days_active_schedule_id
      ON active_schedule_days(active_schedule_id);

      CREATE INDEX IF NOT EXISTS idx_active_schedule_days_weekday_active_schedule_id
      ON active_schedule_days(weekday, active_schedule_id);



    -- Active Schedule Dates
    CREATE TABLE IF NOT EXISTS active_schedule_dates (
      id TEXT PRIMARY KEY NOT NULL,
      active_schedule_id TEXT NOT NULL,
      date TEXT NOT NULL,

      FOREIGN KEY (active_schedule_id)
        REFERENCES active_schedules(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_active_schedule_dates_active_schedule_id
      ON active_schedule_dates(active_schedule_id);
  `);
};
