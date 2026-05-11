import { ActiveScheduleConfig } from "@/type/alarm";
import db from "../db";

export async function saveSchedule(config: ActiveScheduleConfig) {
  db.runSync(
    `INSERT OR REPLACE INTO active_schedules
     (id, schedule_items, date_mode, start_day, end_day, specific_date, recurring, enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      config.id,
      JSON.stringify(config.scheduleItems),
      config.dateMode,
      config.startDay ?? null,
      config.endDay ?? null,
      config.specificDate ?? null,
      config.recurring ? 1 : 0,
      config.enabled ? 1 : 0,
    ],
  );
}

export async function getActiveSchedules(): Promise<ActiveScheduleConfig[]> {
  const rows = db.getAllSync<any>(
    `SELECT * FROM active_schedules WHERE enabled = 1`,
  );
  return rows.map((r) => ({
    id: r.id,
    scheduleItems: JSON.parse(r.schedule_items),
    dateMode: r.date_mode,
    startDay: r.start_day ?? undefined,
    endDay: r.end_day ?? undefined,
    specificDate: r.specific_date ?? undefined,
    recurring: r.recurring === 1,
    enabled: r.enabled === 1,
  }));
}

export async function deleteSchedule(id: string) {
  db.runSync(`DELETE FROM active_schedules WHERE id = ?`, [id]);
}

export async function setScheduleEnabled(id: string, enabled: boolean) {
  db.runSync(`UPDATE active_schedules SET enabled = ? WHERE id = ?`, [
    enabled ? 1 : 0,
    id,
  ]);
}
