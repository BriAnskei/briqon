import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";
import type { Activation } from "../Activation";
import type { ConflictHandler } from "./ConflictHandler";

export class ConflictDetector {
  constructor(private readonly handlers: ConflictHandler[]) {}

  async detect(context: Activation): Promise<ScheduleConflict[]> {
    const res = await Promise.all(this.handlers.map((handler) => handler.check(context)));

    console.log(
      "conflicts:",
      JSON.stringify(
        res.flat(),
        (key, value) => {
          if (value instanceof Date) {
            return value.toLocaleString();
          }

          return value;
        },
        2,
      ),
    );
    return res.flat();
  }
}
