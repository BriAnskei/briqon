import type { ScheduleItem, ScheduleModel } from "@/src/models/schedule.model";
import type { SubSummary } from "@/src/models/sub_summaries.model";
import type { ScheduleSummary } from "@/src/models/summaries.model";

export type CreateSchedulePayloadType = {
  schedule: ScheduleModel;
  summaries: ScheduleSummary[];
  subSummaries: SubSummary[];
};

export type SaveScheduleInput = {
  id: string;
  name: string;
  scheduleItems: ScheduleItem[];
  summaries: ScheduleSummary[];
  subSummaries: SubSummary[];
};
