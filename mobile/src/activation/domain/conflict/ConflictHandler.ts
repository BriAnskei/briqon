import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";
import type { ActivationContext } from "./ActivationContext";

export interface ConflictHandler {
  check(context: ActivationContext): Promise<ScheduleConflict[]>;
}
