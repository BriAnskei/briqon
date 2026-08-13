import { ulid } from "ulid";

export class NonOccuringWindowRange {
  private constructor(
    readonly id: string,
    readonly activeId: string,
    readonly startsAt: Date,
    readonly endsAt: Date,
  ) {}

  static create(activeId: string, startsAt: Date, endsAt: Date): NonOccuringWindowRange {
    return new NonOccuringWindowRange(ulid(), activeId, startsAt, endsAt);
  }
}
