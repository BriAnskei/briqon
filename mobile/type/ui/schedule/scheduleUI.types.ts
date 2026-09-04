import type { ActiveScheduleModel } from "@/src/models/activeSchedule.model";
import type { NonOccuringWindowRangeModel } from "@/src/models/NonOccuringWindowRange.model";
import type { OccuringTimeWindowModel } from "@/src/models/OccuringTimeWindow.model";
import type { ScheduleModel } from "@/src/models/schedule.model";

export type DateActivation = {
  activeSchedule: Omit<ActiveScheduleModel, "active_type" | "recurring"> & {
    active_type: "date";
    recurring: false;
  };

  date: Date;
};

export type NonRecurringDaysActivation = {
  activeSchedule: Omit<ActiveScheduleModel, "active_type" | "recurring"> & {
    active_type: "days";
    recurring: false;
  };

  days: number[];
  ranges: NonOccuringWindowRangeModel[];
};

export type RecurringDaysActivation = {
  activeSchedule: Omit<ActiveScheduleModel, "active_type" | "recurring"> & {
    active_type: "days";
    recurring: true;
  };

  days: number[];
  timeWindow: OccuringTimeWindowModel;
};

export type ActivationUI =
  | DateActivation
  | NonRecurringDaysActivation
  | RecurringDaysActivation;

export interface ScheduleCard {
  schedule: ScheduleModel;
  activations?: ActivationUI[];
  // isActive will detirmine if there is a activation on the schedule
  isActive: boolean;
}
