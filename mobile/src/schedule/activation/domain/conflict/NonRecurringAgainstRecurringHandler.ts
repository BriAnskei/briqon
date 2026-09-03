import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";
import type { ActiveScheduleRepository } from "@/src/repository/activeSchedule.repo";
import type { Activation } from "../Activation";
import type { ConflictHandler } from "./ConflictHandler";

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
