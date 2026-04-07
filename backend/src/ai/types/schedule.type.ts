export interface ScheduleItem {
  start_time: string;
  end_time: string;
  activity: string;
}

export type Schedule = ScheduleItem[];
