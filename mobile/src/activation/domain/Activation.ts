import { ulid } from "ulid";
import type { ActiveType, CreateActivationData } from "../types/CreateActivationData";
import type { ActiveScheduleDate } from "./entity/ActiveScheduleDate";
import type { ActiveScheduleDays } from "./entity/ActiveScheduleDays";
import type { NonOccuringWindowRange } from "./entity/NonOccuringWindowRange";
import type { OccuringOverflow } from "./entity/OccuringOverflow";

export class Activation {
  private days: ActiveScheduleDays[] | null = null;
  private date: ActiveScheduleDate | null = null;

  private nonReccuringRange: NonOccuringWindowRange[] | null = null;
  private occuringOverflow: OccuringOverflow | null = null;

  private constructor(
    readonly id: string,
    readonly scheduleId: string,
    readonly activeType: ActiveType,
    readonly reccuring: boolean,
  ) {}

  static create(data: CreateActivationData) {
    return new Activation(ulid(), data.scheduleId, data.activeType, data.reccuring);
  }

  addDay(day: ActiveScheduleDays) {
    this.days?.push(day);
  }

  setDate(date: ActiveScheduleDate) {
    this.date = date;
  }

  setReccuringOverflow(occuringOverflow: OccuringOverflow) {
    this.occuringOverflow = occuringOverflow;
  }

  getReccuringOverFlow(): OccuringOverflow {
    if (this.activeType === "date" || !this.occuringOverflow)
      throw new Error("Invalid type for activation or No data found in occuringOverflow");
    return this.occuringOverflow;
  }

  addNonReccuringRange(nonOccuringRange: NonOccuringWindowRange) {
    this.nonReccuringRange?.push(nonOccuringRange);
  }

  getDays(): ActiveScheduleDays[] {
    if (!this.days) throw new Error("No data in activation days");
    return [...this.days];
  }

  getDate(): ActiveScheduleDate {
    if (!this.date) throw new Error("No date intance");
    return this.date;
  }
}
