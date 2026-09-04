import type { ActiveScheduleModel } from "@/src/models/activeSchedule.model";
import type { ScheduleModel } from "@/src/models/schedule.model";

export type CreationPayload = {
  isScheduleNeedsToSave: boolean;
  newSchedule?: ScheduleModel;
  newActiveSchedule: ActiveScheduleModel;
  selectedDays?: number[];
  selectedDate?: Date;
};
