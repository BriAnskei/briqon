import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";
import type { Activation } from "../Activation";

export interface ConflictHandler {
  check(context: Activation): Promise<ScheduleConflict[]>;
}
