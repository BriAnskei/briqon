import { ulid } from "ulid";
import type { Schedule } from "../models/schedule.model";
import type { SubSummary } from "../models/sub_summaries.model";
import type { ScheduleSummary } from "../models/summaries.model";
import { ScheduleRepository } from "../repository/schedule.repository";
import { SubSummariesRepository } from "../repository/subSummary.repo";
import { SummariesRepository } from "../repository/summaries.repo";

export type CreateSchedulePayloadType = {
	schedule: Schedule;
	summaries: ScheduleSummary[];
	subSummaries: SubSummary[];
};

export class ScheduleService {
	private repo = new ScheduleRepository();
	private sumRepo = new SummariesRepository();
	private subSumRepo = new SubSummariesRepository();

	async createSchedule(payload: CreateSchedulePayloadType) {
		const { schedule, summaries, subSummaries } = payload;

		this.repo.transaction(async (db) => {
			this.repo.create(schedule, db);
			this.sumRepo.create(summaries, db);
			this.subSumRepo.create(subSummaries, db);
		});
	}

	async findById(id: string): Promise<Schedule> {
		const schedule = await this.repo.findById(id);
		if (!schedule) throw new Error("Schedule does not exist");
		return schedule;
	}

	async fetchAll(): Promise<Schedule[]> {
		return await this.repo.findAll();
	}
}
