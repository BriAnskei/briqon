import type * as SQLite from "expo-sqlite";
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
			starts_at: row.starts_at ? new Date(row.starts_at) : undefined,
			ends_at: row.ends_at ? new Date(row.ends_at) : undefined,
		};
	}

	private groupConflicts(rows: ConflictRow[]): ScheduleConflict[] {
		const conflicts = new Map<string, ScheduleConflict>();

		for (const row of rows) {
			const existing = conflicts.get(row.id);

			if (!existing) {
				conflicts.set(row.id, {
					id: row.id,

					scheduleName: row.schedule_name,
					scheduleId: row.schedule_id,

					activeType: row.active_type,
					recurring: Boolean(row.recurring),

					startsAt: row.starts_at ? new Date(row.starts_at) : undefined,

					endsAt: row.ends_at ? new Date(row.ends_at) : undefined,

					selectedDays:
						row.selected_day !== null ? [row.selected_day] : undefined,

					selectedDate: row.selected_date ?? undefined,
				});

				continue;
			}

			// append additional weekdays
			if (row.selected_day !== null) {
				existing.selectedDays ??= [];

				if (!existing.selectedDays.includes(row.selected_day)) {
					existing.selectedDays.push(row.selected_day);
				}
			}

			// append date if needed
			if (row.selected_date) {
				existing.selectedDate = row.selected_date;
			}
		}

		return Array.from(conflicts.values());
	}
	async create(activeSchedule: ActiveSchedule, db?: SQLite.SQLiteDatabase) {
		return await this.run(
			`
      INSERT INTO active_schedules (
        id,
        schedule_id,
        active_type,
        recurring,
        starts_at,
        ends_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
			[
				activeSchedule.id,
				activeSchedule.schedule_id,
				activeSchedule.active_type,
				activeSchedule.recurring,
				activeSchedule.starts_at?.toISOString() ?? null,
				activeSchedule.ends_at?.toISOString() ?? null,
			],
			db ?? undefined,
		);
	}

	async findRangeOverlaps(
		startsAt?: string,
		endsAt?: string,
	): Promise<ScheduleConflict[]> {
		if (!startsAt || !endsAt) return [];

		const rows = await this.all<ConflictRow>(
			`
			SELECT
				a.id,
				a.schedule_id,
				s.name AS schedule_name,

				a.active_type,
				a.recurring,

				a.starts_at,
				a.ends_at,

				d.weekday AS selected_day,
				ad.date AS selected_date

			FROM active_schedules a

			INNER JOIN schedules s
				ON s.id = a.schedule_id

			LEFT JOIN active_schedule_days d
				ON d.active_schedule_id = a.id

			LEFT JOIN active_schedule_dates ad
				ON ad.active_schedule_id = a.id

			WHERE
				a.starts_at <= ?
				AND a.ends_at >= ?
			`,
			[endsAt, startsAt],
		);

		return this.groupConflicts(rows);
	}

	/** returns reccuring days conflicts */
	async findDayConflicts(days: number[]): Promise<ScheduleConflict[]> {
		const placeholders = days.map(() => "?").join(",");

		const rows = await this.all<ConflictRow>(
			`
		SELECT
			a.id,
			a.schedule_id,
			s.name AS schedule_name,

			a.active_type,
			a.recurring,

			a.starts_at,
			a.ends_at,

			d.weekday AS selected_day,
			NULL AS selected_date

		FROM active_schedules a

		INNER JOIN schedules s
			ON s.id = a.schedule_id

		INNER JOIN active_schedule_days d
			ON d.active_schedule_id = a.id

		WHERE
			d.weekday IN (${placeholders})
			AND a.recurring = 1
		`,
			days,
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
		const rows = await this.all<ActiveScheduleRow>(
			`SELECT * FROM active_schedules`,
		);

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
