import { ulid } from "ulid";
import type { ActiveType } from "../types/ActiveType";
import type { CreateActivationData } from "../types/CreateActivationData";
import type { CreateActiveScheduleInput } from "../types/CreateActiveScheduleInput";
import type { DateTypeActivation } from "../types/payloads/DateTypeActivation";
import type { DayTypeNonOccuringActivation } from "../types/payloads/DayTypeNonOccuringActivation";
import type { DayTypeOccuringActivation } from "../types/payloads/DayTypeOccuringActivation";
import type { ActiveScheduleDate } from "./entity/ActiveScheduleDate";
import type { ActiveScheduleDays } from "./entity/ActiveScheduleDays";
import type { NonOccuringWindowRange } from "./entity/NonOccuringWindowRange";
import type { OccuringTimeWindow } from "./entity/OccurinngTimeWindow";

export class Activation {
  private days: ActiveScheduleDays[] = [];
  private date: ActiveScheduleDate | null = null;

  private nonReccuringRange: NonOccuringWindowRange[] = [];
  private occuringTimeWindow: OccuringTimeWindow | null = null;

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

  setReccuringOverflow(occuringOverflow: OccuringTimeWindow) {
    this.occuringTimeWindow = occuringOverflow;
  }

  addNonReccuringRange(nonOccuringRange: NonOccuringWindowRange) {
    this.nonReccuringRange.push(nonOccuringRange);
  }

  getSelectedDaysArr(): number[] {
    return this.days.map((d) => d.weekday);
  }

  getSelectedDateWeekNumber(): number {
    if(!this.date)
        throw new Error("No Date selected to resolve");
    return this.date.date.getDay()
  }

  getDate(): Date {
    if (!this.date) {
      throw new Error("No Date provided");
    }
    return this.date.date;
  }

  getActiveSchedule(): CreateActiveScheduleInput {
    return {
      id: this.id,
      scheduleId: this.scheduleId,
      activeType: this.activeType,
      reccuring: this.reccuring,
    };
  }

  getDayTypeOccuring(): DayTypeOccuringActivation {
    if (!this.occuringTimeWindow)
      throw new Error("Non occuring day type requires one occuring over flow entity");

    return {
      days: [...this.days],
      occuringTimeWindow: this.occuringTimeWindow,
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
