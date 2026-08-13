import { calculateNextDayMinutes } from "@/utils/TimeFormatter";
import { ulid } from "ulid";

export class OccuringOverflow {
  private constructor(
    readonly id: string,
    readonly activeId: string,
    readonly startDayMinutes: number,
    readonly nextDayMinutesExceed: number,
  ) {}

  static create(activeId: string, startsAt: string, endsAt: string): OccuringOverflow {
    const nextDayMinExceed = calculateNextDayMinutes(startsAt, endsAt);
    return new OccuringOverflow(ulid(), activeId, nextDayMinExceed);
  }
}
