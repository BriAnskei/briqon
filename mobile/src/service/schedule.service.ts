import type { ScheduleItem } from "@/type/MessageTypes";
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

export type SaveScheduleInput = {
  id: string;
  name: string;
  scheduleItems: ScheduleItem[];
  summaries: ScheduleSummary[];
  subSummaries: SubSummary[];
};

export class ScheduleService {
  private repo = new ScheduleRepository();
  private sumRepo = new SummariesRepository();
  private subSumRepo = new SubSummariesRepository();

  async createSchedule(payload: CreateSchedulePayloadType) {
    const { schedule, summaries, subSummaries } = payload;

    await this.repo.transaction(async (db) => {
      await this.repo.create(schedule, db);
      await this.sumRepo.create(summaries, db);
      await this.subSumRepo.create(subSummaries, db);
    });
  }

  /**
   * Domain-driven save: the UI only provides the payload and the domain
   * decides whether to create a new schedule or promote an existing
   * temporary one to permanent.
   *
   * - If a schedule with the given id already exists (e.g. it was saved as
   *   temporary during "Set Active"), it is marked permanent and its name
   *   is updated.
   * - Otherwise a new permanent schedule is created along with its
   *   summaries and sub-summaries.
   */
  async saveSchedule(input: SaveScheduleInput): Promise<void> {
    const scheduleExists = await this.exists(input.id);

    if (scheduleExists) {
      await this.markAsPermanent({ name: input.name, id: input.id });
    } else {
      const schedule: Schedule = {
        id: input.id,
        name: input.name,
        schedule_list: input.scheduleItems,
        temporary: false,
      };
      await this.createSchedule({
        schedule,
        summaries: input.summaries,
        subSummaries: input.subSummaries,
      });
    }
  }

  async findById(id: string): Promise<Schedule> {
    const schedule = await this.repo.findById(id);
    if (!schedule) throw new Error("Schedule does not exist");
    return schedule;
  }

  async exists(id: string): Promise<boolean> {
    return await this.repo.exists(id);
  }

  async fetchAll(): Promise<Schedule[]> {
    return await this.repo.findAll();
  }

  async markAsPermanent(payload: { name: string; id: string }) {
    await this.repo.markAsPermanent(payload);
  }
}
