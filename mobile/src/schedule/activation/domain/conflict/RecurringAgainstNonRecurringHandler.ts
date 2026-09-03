import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";
import type { ActiveScheduleRepository } from "@/src/repository/activeSchedule.repo";
import type { Activation } from "../Activation";
import type { ConflictHandler } from "./ConflictHandler";

export class RecurringAgainstNonRecurringHandler implements ConflictHandler {
  constructor(private readonly activeScheduleRepository: ActiveScheduleRepository) {}
  async check(context: Activation): Promise<ScheduleConflict[]> {
    if (context.activeType !== "days" || !context.reccuring) return [];

    const { days, occuringTimeWindow } = context.getDayTypeOccuring();

    return this.activeScheduleRepository.findNonRecurringConflictsForRecurring({
      weekDays: days.map((d) => d.weekday),
      windowStartMin: occuringTimeWindow.windowStartMin,
      windowEndMin: occuringTimeWindow.windowEndMin,
    });
  }
}
