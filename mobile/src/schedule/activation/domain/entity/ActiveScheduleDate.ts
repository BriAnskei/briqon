import { ulid } from "ulid";

export class ActiveScheduleDate {
  private constructor(
    readonly id: string,
    readonly activeId: string,
    readonly date: Date,
  ) {}

  static create(activeId: string, date: Date) {
    return new ActiveScheduleDate(ulid(), activeId, date);
  }
}
