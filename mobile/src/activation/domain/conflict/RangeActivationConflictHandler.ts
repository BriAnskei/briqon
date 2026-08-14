import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";
import type { ActiveScheduleRepository } from "@/src/repository/activeSchedule.repo";
import type { ActivationContext } from "./ActivationContext";
import type { ConflictHandler } from "./ConflictHandler";

export class RangeActivationConflictHandler implements ConflictHandler {
  constructor(private readonly activeScheduleRepository: ActiveScheduleRepository) {}

  async check(context: ActivationContext): Promise<ScheduleConflict[]> {
    // TODO: implement the range activation conflict handler for non reccuring with the new architecture
    return [];
  }
}
