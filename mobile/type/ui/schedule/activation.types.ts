import type { ScheduleItem } from "@/src/models/schedule.model";
import type { SubSummary } from "@/src/models/sub_summaries.model";
import type { ScheduleSummary } from "@/src/models/summaries.model";

export type CreateActivationInput = {
  scheduleId: string;

  activeType: "days" | "date";

  recurring: boolean;

  selectedDays?: number[];

  selectedDate?: Date;

  overwrite: boolean;

  nonReccuringDaysTypeStartsAt?: Date;

  scheduleTimeStart: string;
  // both HH:MM format
  sheduleTimeEnd: string;

  /**
   * Schedule data, included when the schedule has not yet been persisted.
   * When present, the activation domain will save the schedule as temporary
   * (temporary=true) before creating the activation record.
   */
  scheduleItems?: ScheduleItem[];
  summaries?: ScheduleSummary[];
  subSummaries?: SubSummary[];
};
