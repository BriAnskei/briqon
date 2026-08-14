import { ulid } from "ulid";
import { calculateNextDayMinutes, timeToMinutes } from "@/utils/TimeFormatter";

export class OccuringOverflow {
  private constructor(
    readonly id: string,
    readonly activeId: string,
    readonly startDayMinutes: number,
    readonly nextDayMinutesExceed: number,
  ) {}

  static create(activeId: string, startsAt: string, endsAt: string): OccuringOverflow {
    const startDayMinutes = timeToMinutes(startsAt);
    const nextDayMinExceed = calculateNextDayMinutes(startsAt, endsAt);
    return new OccuringOverflow(ulid(), activeId, startDayMinutes, nextDayMinExceed);
  }
}
