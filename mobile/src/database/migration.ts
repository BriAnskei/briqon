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


    CREATE TABLE IF NOT EXISTS summaries (
        id TEXT PRIMARY KEY NOT NULL,
        schedule_id TEXT NOT NULL,
        name TEXT NOT NULL,
        total TEXT NOT NULL,

        FOREIGN KEY (schedule_id)
            REFERENCES schedules(id)
            ON DELETE CASCADE
    );


    CREATE INDEX IF NOT EXISTS idx_summaries_schedule_id
    ON summaries(schedule_id);


    CREATE TABLE IF NOT EXISTS sub_summaries (
        id TEXT PRIMARY KEY NOT NULL,
        summary_id TEXT NOT NULL,
        name TEXT NOT NULL,
        total TEXT NOT NULL,

        FOREIGN KEY (summary_id)
            REFERENCES summaries(id)
            ON DELETE CASCADE
    );


    CREATE INDEX IF NOT EXISTS idx_sub_summaries_summary_id
    ON sub_summaries(summary_id);




    CREATE TABLE IF NOT EXISTS active_schedules (
      id TEXT PRIMARY KEY NOT NULL,
      schedule_id TEXT NOT NULL,
      active_type TEXT NOT NULL
          CHECK(active_type IN ('date', 'days')),

      recurring INTEGER NOT NULL
          CHECK(recurring IN (0, 1)),

      FOREIGN KEY (schedule_id)
        REFERENCES schedules(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_active_schedules_schedule_id
      ON active_schedules(schedule_id);

    CREATE INDEX IF NOT EXISTS idx_active_schedules_time_range
    ON active_schedules(active_type);





  CREATE TABLE IF NOT EXISTS current_active (
    id TEXT PRIMARY KEY NOT NULL,
    active_id TEXT NOT NULL,
    on_active INTEGER NOT NULL
        CHECK(on_active IN (0, 1)),

    FOREIGN KEY (active_id)
      REFERENCES active_schedules(id)
      ON DELETE CASCADE
  );


    CREATE INDEX IF NOT EXISTS idx_current_active_active_id
      ON current_active(active_id);





    CREATE TABLE IF NOT EXISTS schedule_occurence (
      id TEXT PRIMARY KEY NOT NULL,
      active_id TEXT NOT NULL,
      window_start TEXT NOT NULL,
      window_ends TEXT NOT NULL,

        foreign key (active_id)
          references active_schedules(id)
          on delete cascade
    );

    CREATE INDEX IF NOT EXISTS idx_schedule_occurence_active_id
      ON schedule_occurence(active_id);






    -- Occurring Ending Window
    CREATE TABLE IF NOT EXISTS occurring_overflow (
      id TEXT PRIMARY KEY NOT NULL,
      active_id TEXT NOT NULL,
      window_start_min INTEGER NOT NULL,
      window_end_min INTEGER NOT NULL,

      FOREIGN KEY (active_id)
        REFERENCES active_schedules(id)
        ON DELETE CASCADE
    );

  CREATE INDEX IF NOT EXISTS idx_occurring_overflow_active_id
    ON occurring_overflow(active_id);






    -- Non-Recurring Ranges
    CREATE TABLE IF NOT EXISTS non_recurring_ranges (
      id TEXT PRIMARY KEY NOT NULL,
      active_id TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,

      FOREIGN KEY (active_id)
        REFERENCES active_schedules(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_non_recurring_ranges_active_id
      ON non_recurring_ranges(active_id);

    CREATE INDEX IF NOT EXISTS idx_non_recurring_ranges_time_range
      ON non_recurring_ranges(starts_at, ends_at);







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
