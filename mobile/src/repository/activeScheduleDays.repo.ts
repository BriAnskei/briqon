import type * as SQLite from "expo-sqlite";
import type { ActiveScheduleDays } from "../schedule/activation/domain/entity/ActiveScheduleDays";
import { BaseRepository } from "./base.repository";

export class ActiveScheduleDaysRepository extends BaseRepository {
  async create(activeScheduleDays: ActiveScheduleDays[], db: SQLite.SQLiteDatabase) {
    for (const activeScheduleDay of activeScheduleDays) {
      await this.run(
        `
           INSERT INTO active_schedule_days (
             id,
             active_schedule_id,
             weekday
           )
           VALUES (?, ?, ?)
           `,
        [activeScheduleDay.id, activeScheduleDay.activeId, activeScheduleDay.weekday],
        db,
      );
    }
  }

  async removeActiveScheduleDays(
    activeScheduleId: string,
    weekdays: number[],
  ): Promise<void> {
    if (weekdays.length === 0) return;

    const placeholders = weekdays.map(() => "?").join(",");

    await this.run(
      `
       DELETE FROM active_schedule_days
       WHERE active_schedule_id = ?
       AND weekday IN (${placeholders})
       `,
      [activeScheduleId, ...weekdays],
    );
  }
}
