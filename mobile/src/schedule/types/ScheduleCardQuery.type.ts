export type ScheduleRow = {
  id: string;
  name: string | null;
  schedule_list: string;
  temporary: number;
};

export type ActiveScheduleRow = {
  id: string;
  schedule_id: string;
  active_type: "date" | "days";
  recurring: number;
};

export type CurrentActiveRow = {
  id: string;
  active_id: string;
  on_active: number;
};

export type ScheduleDateRow = {
  id: string;
  active_schedule_id: string;
  date: string;
};

export type ScheduleDayRow = {
  id: string;
  active_schedule_id: string;
  weekday: number;
};

export type NonRecurringRangeRow = {
  id: string;
  active_id: string;
  starts_at: string;
  ends_at: string;
};

export type OccurringTimeWindowRow = {
  id: string;
  active_id: string;
  window_start_min: number;
  window_end_min: number;
};
