import { validate } from "@/utils/zod/schemaValidator";
import { ActiveScheduleRepository } from "../repository/active-schedule.repository";
import {
  ActiveSchedule,
  CreateActivecheduleSchema,
} from "../models/active_schedule.model";
import { ulid } from "ulid";
import { ScheduleRepository } from "../repository/schedule.repository";
import { CreateScheduleSchema, Schedule } from "../models/schedule.model";

export class activeScheduleService {
  private repo = new ActiveScheduleRepository();
  private scheduleRepo = new ScheduleRepository();

  async createActiveSchedule(
    activeScheduleInput: unknown,
    scheduleInput: unknown,
  ) {
    // validate objects first
    const validatedSchedule = validate(CreateScheduleSchema, scheduleInput);
    const validatedActiveSchedule = validate(
      CreateActivecheduleSchema,
      activeScheduleInput,
    );

    // build objects
    let scheduleId = ulid();
    const newSchedule: Schedule = {
      ...validatedSchedule,
      id: scheduleId,
    };
    const newActiveSchedule: ActiveSchedule = {
      ...validatedActiveSchedule,
      id: ulid(),
      schedule_id: scheduleId,
    };

    this.repo.transaction(async (db) => {
      await this.repo.create(newActiveSchedule, db);
      this.scheduleRepo.create(newSchedule, db);
    });

    return newActiveSchedule;
  }

  async findById(id: string) {
    const result = await this.repo.findById(id);
    return result;
  }

  async findAll() {
    const results = await this.repo.findAll();
    return results;
  }

  async updateActiveSchedule(id: string, input: unknown) {
    const validatedRawInput = validate(CreateActivecheduleSchema, input);

    const updated = await this.repo.update(id, validatedRawInput);

    return updated;
  }

  async deleteActiveSchedule(id: string) {
    await this.repo.delete(id);
    return { success: true };
  }
}
