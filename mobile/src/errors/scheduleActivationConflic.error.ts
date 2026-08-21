import type { ActiveSchedule } from "../models/activeSchedule.model";
import { BaseError } from "./business.error";

type SelectedDays = number[];

type NonOccuringTypeActivation = {
  selectedDays?: SelectedDays;
  selectedDate: string;
  ranges: {
    dayNumber: number;
    startsAt: Date;
    endsAt: Date;
  };
};

type OccuringTypeActivation = {
  selectedDays: SelectedDays;
  windowStartMin: number;
  windowEndMin: number;
};

export type ScheduleConflict = {
  id: string;
  scheduleName: string;
  scheduleId: string;
  activeType: ActiveSchedule["active_type"];
  recurring: boolean;

  nonOccuring: NonOccuringTypeActivation;
  occuring: OccuringTypeActivation
};

export class ScheduleConflictError extends BaseError<ScheduleConflict[]> {}
