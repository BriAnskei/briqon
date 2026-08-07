export interface SubActivity {
  name: string;
  total: string;
  total_minutes: number;
}

export interface Category {
  name: string;
  total: string;
  total_minutes: number;
  sub_activity?: SubActivity[];
}

export interface ScheduleItem {
  start_time: string;
  end_time: string;
  activity: string;
}

export interface ScheduleResult {
  summary: {
    categories: Category[];
  };
  schedule: ScheduleItem[];
}
