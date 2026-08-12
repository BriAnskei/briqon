import { ScheduleConflict } from "../errors/scheduleActivationConflic.error";
import { ActiveScheduleRepository } from "../repository/activeSchedule.repo";
import { ActivationContext } from "./ActivationContext";
import { ConflictHandler } from "./ConflictHandler";

export class DaysActivationConflictHandler implements ConflictHandler {
  constructor(private readonly activeScheduleRepository: ActiveScheduleRepository) {}
  async check(context: ActivationContext): Promise<ScheduleConflict[]> {
    const { payload } = context;

    if (!payload.newActiveSchedule.recurring) return [];

    return this.activeScheduleRepository.findDayConflicts(payload.selectedDays ?? []);
  }
}
