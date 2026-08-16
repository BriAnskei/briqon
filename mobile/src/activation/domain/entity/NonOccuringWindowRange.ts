import { ulid } from "ulid";
import { addDays, createTimeRange } from "@/utils/TimeFormatter";

export class NonOccuringWindowRange {
  private constructor(
    readonly id: string,
    readonly activeId: string,
    readonly startsAt: Date,
    readonly endsAt: Date,
  ) {}

  static create(
    activeId: string,
    dayIndex: number,
    scheduleTimeStart: string,
    scheduleTimeEnd: string,
    startDate?: Date,
  ): NonOccuringWindowRange {
    if (!startDate) {
      throw new Error("Non-recurring days activation requires a start date");
    }
    const currentDate = addDays(startDate, dayIndex);

    const { startsAt, endsAt } = createTimeRange(
      currentDate,
      scheduleTimeStart,
      scheduleTimeEnd,
    );

    return new NonOccuringWindowRange(ulid(), activeId, startsAt, endsAt);
  }
}
