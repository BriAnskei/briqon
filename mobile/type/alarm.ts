// types/alarm.ts
import { ScheduleItem } from "./MessageTypes";
import { DateMode } from "@/features/schedule-conversation/util/reviewHelpers";

export type ActiveScheduleConfig = {
  id: string;
  scheduleItems: ScheduleItem[];
  dateMode: DateMode;
  startDay?: number;
  endDay?: number;
  specificDate?: string;
  recurring: boolean;
  enabled: boolean;
};
