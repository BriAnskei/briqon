import type * as SQLite from "expo-sqlite";
import { toLocalISODate } from "@/utils/TimeFormatter";
import type { ActiveScheduleDate } from "../schedule/activation/domain/entity/ActiveScheduleDate";
import { BaseRepository } from "./base.repository";

export class ActiveScheduleDatesRepository extends BaseRepository {
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
}
