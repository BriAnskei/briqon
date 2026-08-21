import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";
import type { ActiveScheduleRepository } from "@/src/repository/activeSchedule.repo";
import { Activation } from "../Activation";
import type { ConflictHandler } from "./ConflictHandler";

export class OccurringActivationHandler implements ConflictHandler {
  constructor(private readonly activeScheduleRepository: ActiveScheduleRepository) {}

  async check(context: Activation): Promise<ScheduleConflict[]> {
    if (!context.reccuring) return [];
    const { days, occuringOverflow } = context.getDayTypeOccuring();

    return await this.activeScheduleRepository.findReccuringConflict({
      weekDays: days.map((d) => d.weekday),
      windowStartMin: occuringOverflow.windowStartMin,
      windowEndMin: occuringOverflow.windowEndMin,
    });
  }
}
