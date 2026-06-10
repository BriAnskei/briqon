import { ulid } from "ulid";
import { Schedule, CreateScheduleSchema } from "../models/schedule.model";
import { ScheduleRepository } from "../repository/schedule.repository";
import { validate } from "@/utils/zod/schemaValidator";

export class ScheduleService {
  private repo = new ScheduleRepository();

  async createSchedule(input: unknown) {
    const validatedRawInput = validate(CreateScheduleSchema, input);

    const schedule: Schedule = {
      ...validatedRawInput,
      id: ulid(),
    };

    await this.repo.create(schedule);

    return schedule;
  }

  async findById(id: string): Promise<Schedule> {
    const schedule = await this.repo.findById(id);
    return schedule!;
  }

  async fetchAll(): Promise<Schedule[]> {
    return await this.repo.findAll();
  }
}
