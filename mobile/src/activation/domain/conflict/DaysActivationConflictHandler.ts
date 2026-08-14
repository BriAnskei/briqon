import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";
import type { ActiveScheduleRepository } from "@/src/repository/activeSchedule.repo";
import type { ActivationContext } from "./ActivationContext";
import type { ConflictHandler } from "./ConflictHandler";

export class DaysActivationConflictHandler implements ConflictHandler {
  constructor(private readonly activeScheduleRepository: ActiveScheduleRepository) {}
  async check(context: ActivationContext): Promise<ScheduleConflict[]> {
    const { payload } = context;

    if (!payload.newActiveSchedule.recurring) return [];

    return this.activeScheduleRepository.findDayConflicts(payload.selectedDays ?? []);
  }
}
