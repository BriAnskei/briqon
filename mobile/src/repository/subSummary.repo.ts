import { SubSummary } from "../models/sub_summaries.model";
import { BaseRepository } from "./base.repository";
import * as SQLite from "expo-sqlite";

export class SubSummariesRepository extends BaseRepository {
	async create(subSummaries: SubSummary[], db?: SQLite.SQLiteDatabase) {
		for (const { id, summary_id, name, total } of subSummaries) {
			await this.run(
				`
       INSERT INTO sub_summaries (
       id,
       summary_id,
       name,
       total
       )
       VALUES (?, ?, ?, ?)
       `,
				[id, summary_id, name, total],
				db,
			);
		}
	}

	async findBySummaryId(
		summaryId: string,
		db: SQLite.SQLiteDatabase,
	): Promise<SubSummary[]> {
		return await this.all<SubSummary>(
			`
      SELECT * FROM sub_summaries WHERE summary_id = ?
      `,
			[summaryId],
			db,
		);
	}
}
