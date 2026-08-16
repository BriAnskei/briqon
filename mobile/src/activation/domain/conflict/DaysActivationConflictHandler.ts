import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";
import type { ActiveScheduleRepository } from "@/src/repository/activeSchedule.repo";
import type { Activation } from "../Activation";
import type { ConflictHandler } from "./ConflictHandler";

export class DaysActivationConflictHandler implements ConflictHandler {
  constructor(private readonly activeScheduleRepository: ActiveScheduleRepository) {}
  async check(context: Activation): Promise<ScheduleConflict[]> {
    if (!context.reccuring) return [];

    return this.activeScheduleRepository.findDayConflicts(payload.selectedDays ?? []);
  }
}
