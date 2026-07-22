import type * as SQLite from "expo-sqlite";
import type { ActiveScheduleDays } from "../models/active_schedule_days.model";
import { BaseRepository } from "./base.repository";

type ActiveScheduleRow = {
	id: string;
	active_schedule_id: string;
	weekday: number;
};

export class ActiveScheduleDaysRepository extends BaseRepository {
	private mapRow(row: ActiveScheduleRow): ActiveScheduleDays {
		return {
			id: row.id,
			active_schedule_id: row.active_schedule_id,
			weekday: row.weekday,
		};
	}

	async create(
		activeScheduleDays: ActiveScheduleDays[],
		db?: SQLite.SQLiteDatabase,
	) {
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
				[
					activeScheduleDay.id,
					activeScheduleDay.active_schedule_id,
					activeScheduleDay.weekday,
				],
				db,
			);
		}
	}

	async fetchAllByActiveScheduleId(
		activeScheduleId: string,
	): Promise<ActiveScheduleDays[]> {
		const row = await this.all<ActiveScheduleRow>(
			`
      SELECT * FROM active_schedule_days WHERE
      active_schedule_id = ?
      `,
			[activeScheduleId],
		);

		return row.map(this.mapRow);
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
