import { ActiveSchedule } from "@/src/models/activeSchedule.model";
import { Schedule } from "@/src/models/schedule.model";

export type CreationPayload = {
  isScheduleNeedsToSave: boolean;
  newSchedule?: Schedule;
  newActiveSchedule: ActiveSchedule;
  selectedDays?: number[];
  selectedDate?: Date;
};
