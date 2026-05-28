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



  CREATE TABLE ac_schedule_selected_days (
    id TEXT PRIMARY KEY NOT NULL,

    active_schedule_id TEXT NOT NULL,

    weekday INTEGER NOT NULL,

    FOREIGN KEY(active_schedule_id)
      REFERENCES active_schedules(id)
      ON DELETE CASCADE
  );


  CREATE INDEX IF NOT EXISTS idx_ac_schedule_selected_days_ac_sched_id
      ON ac_schedule_selected_days(active_schedule_id)




      
  CREATE TABLE active_schedule_specific_dates (
    id TEXT PRIMARY KEY NOT NULL,

    active_schedule_id TEXT NOT NULL,

    specific_date TEXT NOT NULL,

    FOREIGN KEY(active_schedule_id)
      REFERENCES active_schedules(id)
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_active_schedule_specific_dates_act_sched_id
      ON active_schedule_specific_dates(active_schedule_id)


  
  `);
};
