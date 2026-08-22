import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";
import type { ActiveScheduleRepository } from "@/src/repository/activeSchedule.repo";
import type { Activation } from "../../domain/Activation";
import type { ConflictHandler } from "../../domain/conflict/ConflictHandler";

export class NonRecurringAgainstRecurringHandler implements ConflictHandler {
  constructor(private readonly activeScheduleRepository: ActiveScheduleRepository) {}
  async check(context: Activation): Promise<ScheduleConflict[]> {
    if (context.reccuring) return [];
    const ranges =
      context.activeType === "date"
        ? [context.getDateType().range]
        : context.getDayTypeNonOccuring().ranges;

    if (ranges.length === 0) return [];

    return this.activeScheduleRepository.findRecurringConflictsForNonRecurring(
      ranges.map((r) => ({ startsAt: r.startsAt, endsAt: r.endsAt })),
    );
  }
}
