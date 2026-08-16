import { ulid } from "ulid";
import type { ActiveType, CreateActivationData } from "../types/CreateActivationData";
import type { DateTypeActivation } from "../types/DateTypeActivation";
import type { DayTypeNonOccuringActivation } from "../types/DayTypeNonOccuringActivation";
import type { DayTypeOccuringActivation } from "../types/DayTypeOccuringActivation";
import type { ActiveScheduleDate } from "./entity/ActiveScheduleDate";
import type { ActiveScheduleDays } from "./entity/ActiveScheduleDays";
import type { NonOccuringWindowRange } from "./entity/NonOccuringWindowRange";
import type { OccuringOverflow } from "./entity/OccuringOverflow";

export class Activation {
  private days: ActiveScheduleDays[] = [];
  private date: ActiveScheduleDate | null = null;

  private nonReccuringRange: NonOccuringWindowRange[] = [];
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
    this.days.push(day);
  }

  setDate(date: ActiveScheduleDate) {
    this.date = date;
  }

  setReccuringOverflow(occuringOverflow: OccuringOverflow) {
    this.occuringOverflow = occuringOverflow;
  }

  addNonReccuringRange(nonOccuringRange: NonOccuringWindowRange) {
    this.nonReccuringRange.push(nonOccuringRange);
  }

  getDayTypeOccuring(): DayTypeOccuringActivation {
    if (!this.occuringOverflow)
      throw new Error("Non occuring day type requires one occuring over flow entity");

    return {
      days: this.days,
      occuringOverflow: this.occuringOverflow,
    };
  }

  getDayTypeNonOccuring(): DayTypeNonOccuringActivation {
    if (this.nonReccuringRange.length !== this.days.length)
      throw new Error("Days type non reccuring requires a reccuring ranges for each day");

    return {
      days: this.days,
      ranges: this.nonReccuringRange,
    };
  }

  getDateType(): DateTypeActivation {
    if (!this.date) throw new Error("Date type activation requires a date data");
    if (this.nonReccuringRange.length === 0)
      throw new Error("Date type activation requies one nonOccuring range");
    return {
      date: this.date,
      range: this.nonReccuringRange[this.nonReccuringRange.length - 1],
    };
  }
}
