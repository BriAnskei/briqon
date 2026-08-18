import { ulid } from "ulid";
import { createWindowMinutesFromTime } from "@/utils/TimeFormatter";

export class OccuringOverflow {
  private constructor(
    readonly id: string,
    readonly activeId: string,
    readonly windowStartMin: number,
    readonly windowEndMin: number,
  ) {}

  static create(activeId: string, startsAt: string, endsAt: string): OccuringOverflow {
    const { windowStartMin, windowEndMin } = createWindowMinutesFromTime(
      startsAt,
      endsAt,
    );

    return new OccuringOverflow(ulid(), activeId, windowStartMin, windowEndMin);
  }
}
