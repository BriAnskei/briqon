import type * as SQLite from "expo-sqlite";
import {
  type OccuringTimeWindowModel,
  OccuringTimeWindowSchema,
} from "../models/OccuringTimeWindow.model";
import type { OccuringTimeWindow } from "../schedule/activation/domain/entity/OccurinngTimeWindow";
import { BaseRepository } from "./base.repository";

type OccuringTimeWindowRow = {
  id: string;
  active_id: string;
  window_start_min: number;
  window_end_min: number;
};

export class OccurringTimeWindowRepository extends BaseRepository {
  private mapToDomain(row: OccuringTimeWindowRow): OccuringTimeWindowModel {
    const data = OccuringTimeWindowSchema.parse(row);

    return {
      id: data.id,
      active_id: data.active_id,
      window_start_min: data.window_start_min,
      window_end_min: data.window_end_min,
    };
  }

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

  async findAll(db: SQLite.SQLiteDatabase): Promise<OccuringTimeWindowModel[]> {
    const rows = await db.getAllAsync<OccuringTimeWindowRow>(
      `
        SELECT
          id,
          active_id,
          window_start_min,
          window_end_min
        FROM occurring_time_window
        ORDER BY rowid ASC
      `,
    );

    return rows.map((row) => this.mapToDomain(row));
  }
}
