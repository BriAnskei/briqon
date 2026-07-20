import { ActiveScheduleDates } from "../models/active_schedule_dates.model";
import { BaseRepository } from "./base.repository";
import * as SQLite from "expo-sqlite";

export class ActiveScheduleDatesRepository extends BaseRepository {
	private mapRow(row: any): ActiveScheduleDates {
		return {
			id: row.id,
			active_schedule_id: row.active_schedule_id,
			date: new Date(row.date),
		};
	}

	async create(
		activeScheduleDate: ActiveScheduleDates,
		db?: SQLite.SQLiteDatabase,
	) {
		return await this.run(
			`
      INSERT INTO active_schedule_dates (
        id,
        active_schedule_id,
        specific_date
      )
      `,
			[
				activeScheduleDate.id,
				activeScheduleDate.active_schedule_id,
				activeScheduleDate.date.toISOString(),
			],
			db,
		);
	}

	async fetchByActiveScheduleId(
		activeScheduleId: string,
	): Promise<ActiveScheduleDates> {
		const row = this.first(
			`
      SELECT * FROM active_schedule_dates
      WHERE active_schedule_id = ?
      `,
			[activeScheduleId],
		);

		return this.mapRow(row);
	}
}
