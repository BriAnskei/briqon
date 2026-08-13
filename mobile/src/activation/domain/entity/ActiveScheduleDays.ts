import { ulid } from "ulid";

export class ActiveScheduleDays {
  private constructor(
    readonly id: string,
    readonly activeId: string,
    readonly weekday: number,
  ) {}

  static create(activeId: string, weekday: number): ActiveScheduleDays {
    return new ActiveScheduleDays(ulid(), activeId, weekday);
  }
}
