import { ulid } from "ulid";
import { createWindowMinutesFromTime } from "@/utils/TimeFormatter";

export class OccuringTimeWindow {
  private constructor(
    readonly id: string,
    readonly activeId: string,
    readonly windowStartMin: number,
    readonly windowEndMin: number,
  ) {}

  static create(activeId: string, startsAt: string, endsAt: string): OccuringTimeWindow {
    const { windowStartMin, windowEndMin } = createWindowMinutesFromTime(
      startsAt,
      endsAt,
    );

    return new OccuringTimeWindow(ulid(), activeId, windowStartMin, windowEndMin);
  }
}
