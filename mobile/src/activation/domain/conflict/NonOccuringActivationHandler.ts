import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";
import type { ActiveScheduleRepository } from "@/src/repository/activeSchedule.repo";
import type { Activation } from "../Activation";
import type { ConflictHandler } from "./ConflictHandler";

export class NonOccuringActivationHandler implements ConflictHandler {
  constructor(private readonly activeScheduleRepository: ActiveScheduleRepository) {}
  async check(context: Activation): Promise<ScheduleConflict[]> {
    if (!context.reccuring) return [];

    const dateConflicts = await this.handleDateTypeConflict(context);
    const daysConflicts = await this.handleDaysTypeConflict(context);

    return [...dateConflicts, ...daysConflicts];
  }

  private handleDateTypeConflict(context: Activation) {
    const { range } = context.getDateType();

    return this.activeScheduleRepository.findNonOccurringConflict([
      { startsAt: range.startsAt, endsAt: range.endsAt },
    ]);
  }

  private handleDaysTypeConflict(context: Activation) {
    const { ranges } = context.getDayTypeNonOccuring();

    const rangesInput = ranges.map((range) => ({
      startsAt: range.startsAt,
      endsAt: range.endsAt,
    }));

    return this.activeScheduleRepository.findNonOccurringConflict(rangesInput);
  }
}
