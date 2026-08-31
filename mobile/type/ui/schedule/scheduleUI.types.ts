import type { NonOccuringWindowRange } from "@/src/activation/domain/entity/NonOccuringWindowRange";
import type { OccuringTimeWindow } from "@/src/activation/domain/entity/OccurinngTimeWindow";
import type { ActiveSchedule } from "@/src/models/activeSchedule.model";
import type { Schedule } from "@/src/models/schedule.model";

interface Activation {
  data: ActiveSchedule;
  range?: NonOccuringWindowRange[];
  timeWindow?: OccuringTimeWindow;
}

export interface ScheduleUI {
  schedule: Schedule;
  activation?: Activation;
  isActive: boolean;
}
