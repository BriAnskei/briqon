import { Schedule, CreateSchedule } from "../models/schedule.model";
import { ScheduleRepository } from "../repository/schedule.repository";
import { ScheduleSummary } from "../models/summaries.model";
import { CreateSubSummary, SubSummary } from "../models/sub_summaries.model";
import { ulid } from "ulid";
import { ScheduleItem } from "@/features/schedule/components/GenerateScheduleScreen/types";
import { buildEntity } from "../models/factories/base.factory";
import { SummariesRepository } from "../repository/summaries.repo";
import { SubSummariesRepository } from "../repository/subSummary.repo";

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
		let { schedule, summaries, subSummaries } = payload;

		// initialize id
		const scheduleId = ulid();
		schedule = { ...schedule, id: scheduleId };
		summaries.forEach((s) => {
			s.schedule_id = scheduleId;
		});

		this.repo.transaction(async (db) => {
			this.repo.create(schedule, db);
			this.sumRepo.create(summaries, db);
			this.subSumRepo.create(subSummaries, db);
		});
	}

	async findById(id: string): Promise<Schedule> {
		const schedule = await this.repo.findById(id);
		return schedule!;
	}

	async fetchAll(): Promise<Schedule[]> {
		return await this.repo.findAll();
	}
}
