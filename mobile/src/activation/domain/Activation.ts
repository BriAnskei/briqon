import { ulid } from "ulid";
import { ActiveScheduleDate } from "./entity/ActiveScheduleDate";
import { ActiveScheduleDays } from "./entity/ActiveScheduleDays";
import { ActiveType, CreateActivationData } from "../types/CreateActivationData";
import { NonOccuringWindowRange as NonOccuringwindowRange } from "./entity/NonOccuringWindowRange";
import { OccuringOverflow } from "./entity/OccuringOverflow";

export class Activation {
  private days: ActiveScheduleDays[] | null = null;
  private date: ActiveScheduleDate | null = null;

  private nonReccuringRange: NonOccuringwindowRange[] | null = null;
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
    (this.days ?? []).push(day);
  }

  setDate(date: ActiveScheduleDate) {
    this.date = date;
  }

  setReccuringOverflow(occuringOverflow: OccuringOverflow) {
    this.occuringOverflow = occuringOverflow;
  }
  
  addNonReccuringRange()

  getDays(): ActiveScheduleDays[] {
    return [...(this.days ?? [])];
  }

  getDate(): ActiveScheduleDate {
    if (!this.date) throw new Error("No date intance");

    return this.date;
  }
}
