import { ScheduleSummary } from "../models/summaries.model";
import { BaseRepository } from "./base.repository";
import * as SQLite from "expo-sqlite";

export class SummariesRepository extends BaseRepository {
	async create(summaries: ScheduleSummary[], db?: SQLite.SQLiteDatabase) {
		for (const { id, schedule_id, name, total } of summaries) {
			await this.run(
				`
            INSERT INTO summaries (
              id,
              schedule_id,
              name,
              total
            )
            VALUES (?, ?, ?, ?)
          `,
				[id, schedule_id, name, total],
				db,
			);
		}
	}

	async findByScheduleId(
		scheduleId: string,
		db?: SQLite.SQLiteDatabase,
	): Promise<ScheduleSummary[]> {
		return await this.all<ScheduleSummary>(
			`
        SELECT * FROM summaries
        WHERE schedule_id = ?
      `,
			[scheduleId],
			db,
		);
	}
}
