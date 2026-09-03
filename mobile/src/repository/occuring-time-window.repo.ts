import type * as SQLite from "expo-sqlite";
import type { OccuringTimeWindow } from "../schedule/activation/domain/entity/OccurinngTimeWindow";
import { BaseRepository } from "./base.repository";

export class OccurringTimeWindowRepository extends BaseRepository {
  async create(payload: OccuringTimeWindow, db: SQLite.SQLiteDatabase): Promise<void> {
    await this.run(
      `
    INSERT INTO occurring_time_window (
    id,
    active_id,
    window_start_min,
    window_end_min
   )
   VALUES (?, ?, ?, ?)
`,
      [payload.id, payload.activeId, payload.windowStartMin, payload.windowEndMin],
      db,
    );
  }
}
