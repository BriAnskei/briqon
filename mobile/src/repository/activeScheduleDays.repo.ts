import type * as SQLite from "expo-sqlite";
import {
  type ActiveScheduleDaysModel,
  ActiveScheduleDaysSchema,
} from "../models/active_schedule_days.model";
import type { ActiveScheduleDays } from "../schedule/activation/domain/entity/ActiveScheduleDays";
import { BaseRepository } from "./base.repository";

type ActiveScheduleDaysRow = {
  id: string;
  active_schedule_id: string;
  weekday: number;
};

export class ActiveScheduleDaysRepository extends BaseRepository {
  private mapToDomain(row: ActiveScheduleDaysRow): ActiveScheduleDaysModel {
    const data = ActiveScheduleDaysSchema.parse(row);

    return {
      id: data.id,
      active_schedule_id: data.active_schedule_id,
      weekday: data.weekday,
    };
  }
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

  async findAll(db: SQLite.SQLiteDatabase): Promise<ActiveScheduleDaysModel[]> {
    const rows = await db.getAllAsync<ActiveScheduleDaysRow>(
      `
        SELECT
          id,
          active_schedule_id,
          weekday
        FROM active_schedule_days
        ORDER BY rowid ASC
      `,
    );

    return rows.map((row) => this.mapToDomain(row));
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
