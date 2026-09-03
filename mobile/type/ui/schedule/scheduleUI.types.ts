import type { ActiveSchedule } from "@/src/models/activeSchedule.model";
import type { NonOccuringWindowRange } from "@/src/models/NonOccuringWindowRange.model";
import type { OccuringTimeWindow } from "@/src/models/OccuringTimeWindow.model";
import type { Schedule } from "@/src/models/schedule.model";

type DateActivation = {
  activeSchedule: ActiveSchedule & {
    active_type: "date";
    recurring: false;
  };

  date: string;
};

type NonRecurringDaysActivation = {
  activeSchedule: ActiveSchedule & {
    active_type: "days";
    recurring: false;
  };

  days: number[];
  ranges: NonOccuringWindowRange[];
};

type RecurringDaysActivation = {
  activeSchedule: ActiveSchedule & {
    active_type: "days";
    recurring: true;
  };

  days: number[];
  timeWindow: OccuringTimeWindow;
};

export type Activation =
  DateActivation | NonRecurringDaysActivation | RecurringDaysActivation;

export interface ScheduleCard {
  schedule: Schedule;
  activation?: Activation;
  isActive: boolean;
}
