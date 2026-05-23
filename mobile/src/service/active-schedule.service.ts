import { validate } from "@/utils/zod/schemaValidator";
import { ActiveScheduleRepository } from "../repository/active-schedule.repository";
import {
  ActiveSchedule,
  CreateActivecheduleSchema,
} from "../models/active_schedule.model";
import { ulid } from "ulid";

export class activeScheduleService {
  private repo = new ActiveScheduleRepository();

  async createActiveSchedule(input: unknown) {
    const validatedRawInput = validate(CreateActivecheduleSchema, input);

    const newActiveSchedule: ActiveSchedule = {
      ...validatedRawInput,
      id: ulid(),
    };

    await this.repo.create(newActiveSchedule);

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
