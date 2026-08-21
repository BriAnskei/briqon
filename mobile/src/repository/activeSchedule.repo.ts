import type * as SQLite from "expo-sqlite";
import { CreateActivationInput } from "@/type/ui/schedule/activation.types";
import { parseLocalISODate } from "@/utils/TimeFormatter";
import type { CreateActiveScheduleInput } from "../activation/types/CreateActiveScheduleInput";
import type { FindNonReccuringActivationConflictInput } from "../activation/types/conflictHandler/FindNonOccuringActivationConflictInput";
import type { FindReccuringActivationConflictInput } from "../activation/types/conflictHandler/FindReccuringActivationConflictInput";
import type { ScheduleConflict } from "../errors/scheduleActivationConflic.error";
import type { ActiveSchedule } from "../models/activeSchedule.model";
import { BaseRepository } from "./base.repository";

type ConflictRow = {
  id: string;
  schedule_id: string;
  schedule_name: string;

  active_type: ActiveSchedule["active_type"];
  recurring: number;

  starts_at: string | null;
  ends_at: string | null;

  selected_day: number | null;
  selected_date: string | null;

  /** Minutes-from-midnight — populated for recurring (occurring) conflicts. */
  window_start_min: number | null;
  window_end_min: number | null;
};

type ActiveScheduleRow = {
  id: string;
  schedule_id: string;
  active_type: ActiveSchedule["active_type"];
  repeat_weekly: number; // SQLite stores booleans as 0/1
  starts_at: string | null;
  ends_at: string | null;
};

export class ActiveScheduleRepository extends BaseRepository {
  private mapRow(row: ActiveScheduleRow): ActiveSchedule {
    return {
      id: row.id,
      schedule_id: row.schedule_id,
      active_type: row.active_type,
      recurring: !!row.repeat_weekly,
    };
  }

  private groupConflicts(rows: ConflictRow[]): ScheduleConflict[] {
    const conflicts = new Map<string, ScheduleConflict>();

    for (const row of rows) {
      const existing = conflicts.get(row.id);
      const isRecurring = Boolean(row.recurring);

      if (!existing) {
        const conflict: ScheduleConflict = {
          id: row.id,
          scheduleName: row.schedule_name,
          scheduleId: row.schedule_id,
          activeType: row.active_type,
          recurring: isRecurring,
          nonOccuring: isRecurring
            ? undefined
            : { selectedDays: [], selectedDate: "", ranges: [] },
          occuring: isRecurring
            ? { selectedDays: [], windowStartMin: 0, windowEndMin: 0 }
            : undefined,
        };

        this.applyRowToConflict(conflict, row);
        conflicts.set(row.id, conflict);
        continue;
      }

      this.applyRowToConflict(existing, row);
    }

    return Array.from(conflicts.values());
  }

  /**
   * Merges a single SQL row into the appropriate nested branch
   * (`occuring` for recurring, `nonOccuring` for non-recurring)
   * of a `ScheduleConflict` object.
   */
  private applyRowToConflict(conflict: ScheduleConflict, row: ConflictRow): void {
    if (conflict.occuring) {
      // Recurring conflict — collect every selected weekday and the window
      if (row.selected_day !== null) {
        if (!conflict.occuring.selectedDays.includes(row.selected_day)) {
          conflict.occuring.selectedDays.push(row.selected_day);
        }
      }
      if (row.window_start_min !== null) {
        conflict.occuring.windowStartMin = row.window_start_min;
      }
      if (row.window_end_min !== null) {
        conflict.occuring.windowEndMin = row.window_end_min;
      }
    }

    if (conflict.nonOccuring) {
      // Non-recurring conflict — collect selected days, date and all ranges
      if (row.selected_day !== null) {
        conflict.nonOccuring.selectedDays ??= [];
        if (!conflict.nonOccuring.selectedDays.includes(row.selected_day)) {
          conflict.nonOccuring.selectedDays.push(row.selected_day);
        }
      }
      if (row.selected_date) {
        conflict.nonOccuring.selectedDate = row.selected_date;
      }
      if (row.starts_at && row.ends_at) {
        conflict.nonOccuring.ranges.push({
          dayNumber: row.selected_day ?? 0,
          startsAt: parseLocalISODate(row.starts_at),
          endsAt: parseLocalISODate(row.ends_at),
        });
      }
    }
  }

  async create(activeSchedule: CreateActiveScheduleInput, db: SQLite.SQLiteDatabase) {
    return await this.run(
      `
      INSERT INTO active_schedules (
        id,
        schedule_id,
        active_type,
        recurring,
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        activeSchedule.id,
        activeSchedule.scheduleId,
        activeSchedule.activeType,
        activeSchedule.reccuring,
      ],
      db ?? undefined,
    );
  }

  async findReccuringConflict(input: FindReccuringActivationConflictInput) {
    const placeholders = input.weekDays.map(() => "?").join(", ");

    const previousWeekDays = input.weekDays.map((day) => (day - 1 + 7) % 7);

    const previousPlaceholders = previousWeekDays.map(() => "?").join(", ");

    const rows = await this.all<ConflictRow>(
      `
    SELECT DISTINCT
      a.id,
      a.schedule_id,
      s.name AS schedule_name,

      a.active_type,
      a.recurring,

      d.weekday AS selected_day,

      NULL AS selected_date,

      o.window_start_min,
      o.window_end_min

    FROM active_schedules a

    JOIN schedules s
      ON s.id = a.schedule_id

    JOIN active_schedule_days d
      ON d.active_schedule_id = a.id

    JOIN occurring_time_window o
      ON o.active_id = a.id

    WHERE a.active_type = 'days'
      AND a.recurring = 1

      AND EXISTS (
        SELECT 1

        FROM active_schedule_days conflict_day

        JOIN occurring_time_window conflict_window
          ON conflict_window.active_id = a.id

        WHERE conflict_day.active_schedule_id = a.id

          AND (
            -- Same weekday conflict
            (
              conflict_day.weekday IN (${placeholders})

              AND conflict_window.window_start_min < ?
              AND conflict_window.window_end_min > ?
            )

            OR

            -- Previous weekday / overnight conflict
            (
              conflict_day.weekday IN (${previousPlaceholders})

              AND conflict_window.window_end_min > 1440

              AND (conflict_window.window_end_min - 1440) > ?
            )
          )
      )
    `,
      [
        ...input.weekDays,

        input.windowEndMin,
        input.windowStartMin,

        ...previousWeekDays,

        input.windowStartMin,
      ],
    );

    return this.groupConflicts(rows);
  }

  async findNonOccurringConflict(
    ranges: FindNonReccuringActivationConflictInput[],
  ): Promise<ScheduleConflict[]> {
    if (ranges.length === 0) {
      return [];
    }

    const conditions = ranges
      .map(() => `(r.starts_at < ? AND r.ends_at > ?)`)
      .join(" OR ");

    const params = ranges.flatMap((range) => [
      range.endsAt.toISOString(),
      range.startsAt.toISOString(),
    ]);

    const rows = await this.all<ConflictRow>(
      `
    SELECT
    a.id,
    a.schedule_id,
    s.name AS schedule_name,

    a.active_type,
    a.recurring,

    r.starts_at,
    r.ends_at,

    d.weekday AS selected_day,
    ad.date AS selected_date

  FROM non_recurring_ranges r

  JOIN active_schedules a
    ON a.id = r.active_id

  JOIN schedules s
    ON s.id = a.schedule_id

  LEFT JOIN active_schedule_days d
    ON d.active_schedule_id = a.id

  LEFT JOIN active_schedule_dates ad
    ON ad.active_schedule_id = a.id

  WHERE
  a.recurring = 0 AND
 ${conditions}
    `,
      params,
    );

    return this.groupConflicts(rows);
  }

  async findById(id: string): Promise<ActiveSchedule | null> {
    const row = await this.first<ActiveScheduleRow>(
      `SELECT * FROM active_schedules WHERE id = ?`,
      [id],
    );

    if (!row) return null;
    return this.mapRow(row);
  }

  async findAll(): Promise<ActiveSchedule[]> {
    const rows = await this.all<ActiveScheduleRow>(`SELECT * FROM active_schedules`);

    return rows.map(this.mapRow);
  }

  async update(id: string, activeSchedule: Partial<ActiveSchedule>) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: ActiveSchedule = {
      ...existing,
      ...activeSchedule,
    };

    await this.run(
      `
      UPDATE active_schedules
      SET
        schedule_id = ?,
        specific_date = ?,
        selected_days = ?,
        repeat_weekly = ?,
        starts_at = ?,
        ends_at = ?
      WHERE id = ?
      `,
      [
        // updated.schedule_id,
        // updated.specific_date?.toISOString() ?? null,
        // JSON.stringify(updated.selected_days),
        // updated.repeat_weekly ? 1 : 0,
        // updated.starts_at?.toISOString() ?? null,
        // updated.ends_at?.toISOString() ?? null,
        // id,
      ],
    );

    return updated;
  }

  async delete(id: string) {
    await this.run(`DELETE FROM active_schedules WHERE id = ?`, [id]);
  }
}
