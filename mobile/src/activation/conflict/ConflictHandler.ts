import { ScheduleConflict } from "../errors/scheduleActivationConflic.error";
import { ActivationContext } from "./ActivationContext";

export interface ConflictHandler {
  check(context: ActivationContext): Promise<ScheduleConflict[]>;
}
