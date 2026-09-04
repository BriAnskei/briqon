import type * as SQLite from "expo-sqlite";
import { toLocalISODate } from "@/utils/TimeFormatter";
import {
  type ActiveScheduleDatesModel,
  ActiveSheduleDatesSchema,
} from "../models/active_schedule_dates.model";
import type { ActiveScheduleDate } from "../schedule/activation/domain/entity/ActiveScheduleDate";
import { BaseRepository } from "./base.repository";

type ActiveScheduleDateRow = {
  id: string;
  active_schedule_id: string;
  date: string;
};

export class ActiveScheduleDatesRepository extends BaseRepository {
  private mapToDomain(row: ActiveScheduleDateRow): ActiveScheduleDatesModel {
    const data = ActiveSheduleDatesSchema.parse(row);

    return {
      id: data.id,
      active_schedule_id: data.active_schedule_id,
      date: new Date(`${data.date}T00:00:00`),
    };
  }
  async create(activeScheduleDate: ActiveScheduleDate, db: SQLite.SQLiteDatabase) {
    return await this.run(
      `
      INSERT INTO active_schedule_dates (
        id,
        active_schedule_id,
        date
      )
      VALUES (?, ?, ?)
`,
      [
        activeScheduleDate.id,
        activeScheduleDate.activeId,
        toLocalISODate(activeScheduleDate.date),
      ],
      db,
    );
  }
  async findAll(db: SQLite.SQLiteDatabase): Promise<ActiveScheduleDatesModel[]> {
    const rows = await this.all<ActiveScheduleDateRow>(
      `
        SELECT
          id,
          active_schedule_id,
          date
        FROM active_schedule_dates
        ORDER BY rowid ASC
      `,
      [],
      db,
    );

    return rows.map((row) => this.mapToDomain(row));
  }
}
