import type * as SQLite from "expo-sqlite";
import type { NonOccuringWindowRange } from "../activation/domain/entity/NonOccuringWindowRange";
import { BaseRepository } from "./base.repository";

export class NonReccurringRangeRepository extends BaseRepository {
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
}
