import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";
import type { ActivationContext } from "./ActivationContext";
import type { ConflictHandler } from "./ConflictHandler";

export class ConflictDetector {
  constructor(private readonly handlers: ConflictHandler[]) {}

  async detect(context: ActivationContext): Promise<ScheduleConflict[]> {
    const res = await Promise.all(this.handlers.map((handler) => handler.check(context)));
    return res.flat();
  }
}
