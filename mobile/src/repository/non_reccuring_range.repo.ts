import type * as SQLite from "expo-sqlite";
import {
  type NonOccuringWindowRangeModel,
  NonOccuringWindowRangeSchema,
} from "../models/NonOccuringWindowRange.model";
import type { NonOccuringWindowRange } from "../schedule/activation/domain/entity/NonOccuringWindowRange";
import { BaseRepository } from "./base.repository";

type NonRecurringRangeRow = {
  id: string;
  active_id: string;
  starts_at: string;
  ends_at: string;
};

export class NonReccurringRangeRepository extends BaseRepository {
  private map(row: NonRecurringRangeRow): NonOccuringWindowRangeModel {
    const data = NonOccuringWindowRangeSchema.parse(row);

    return {
      id: data.id,
      activeId: data.activeId,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
    };
  }

  async create(
    payloads: NonOccuringWindowRange[],
    db: SQLite.SQLiteDatabase,
  ): Promise<void> {
    for (const payload of payloads) {
      await this.run(
        `
      INSERT INTO non_recurring_ranges (
      id,
      active_id,
      starts_at,
      ends_at
      )
      VALUES (?, ?, ?, ?)
    `,
        [
          payload.id,
          payload.activeId,
          payload.startsAt.toISOString(),
          payload.endsAt.toISOString(),
        ],
        db,
      );
    }
  }

  async findAll(db: SQLite.SQLiteDatabase): Promise<NonOccuringWindowRangeModel[]> {
    const rows = await db.getAllAsync<NonRecurringRangeRow>(
      `
        SELECT
          id,
          active_id,
          starts_at,
          ends_at
        FROM non_recurring_ranges
        ORDER BY rowid ASC
      `,
    );

    return rows.map((row) => this.map(row));
  }
}
