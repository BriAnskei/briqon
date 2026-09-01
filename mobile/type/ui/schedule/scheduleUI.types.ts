import type { ActiveSchedule } from "@/src/models/activeSchedule.model";
import type { NonOccuringWindowRange } from "@/src/models/NonOccuringWindowRange.model";
import type { OccuringTimeWindow } from "@/src/models/OccuringTimeWindow.model";
import type { Schedule } from "@/src/models/schedule.model";

interface Activation {
  data: ActiveSchedule;
  days: number[];
  range?: NonOccuringWindowRange[];
  timeWindow?: OccuringTimeWindow;
}

export interface ScheduleCard {
  schedule: Schedule;
  activation?: Activation;
  isActive: boolean;
}
