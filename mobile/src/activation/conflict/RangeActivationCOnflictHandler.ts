import { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";
import { ActivationContext } from "./ActivationContext";
import { ConflictHandler } from "./ConflictHandler";
import { ActiveScheduleRepository } from "@/src/repository/activeSchedule.repo";

export class RangeActivationConflictHandler implements ConflictHandler {
  constructor(private readonly activeScheduleRepository: ActiveScheduleRepository) {}

  async check(context: ActivationContext): Promise<ScheduleConflict[]> {
    // TODO: implement the range activation conflict handler for non reccuring with the new architecture
    return [];
  }
}
