import { ActiveScheduleDays } from "../models/active_schedule_days.model";
import { BaseRepository } from "./base.repository";
import * as SQLite from "expo-sqlite";

export class ActiveScheduleDaysRepository extends BaseRepository {
  private mapRow(row: any): ActiveScheduleDays {
    return {
      id: row.id,
      active_schedule_id: row.active_schedule_id,
      weekday: row.weekday,
    };
  }

  async create(
    activeScheduleDays: ActiveScheduleDays,
    db?: SQLite.SQLiteDatabase,
  ) {
    return await this.run(
      `
      INSERT INTO active_schedule_days (
        id,
        active_schedule_id,
        weekday
      )
      VALUES (?, ?, ?)
      `,
      [
        activeScheduleDays.id,
        activeScheduleDays.active_schedule_id,
        activeScheduleDays.weekday,
      ],
      db,
    );
  }
}
