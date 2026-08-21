import type { NonOccuringWindowRange } from "../../domain/entity/NonOccuringWindowRange";
import type { CreateActiveScheduleDaysInput } from "../CreateActiveScheduleDaysInput";
import type { CreateActiveScheduleInput } from "../CreateActiveScheduleInput";

export type DayTypeNonOccuringActivation = {
  activeSchedule: CreateActiveScheduleInput;
  days: CreateActiveScheduleDaysInput[];
  ranges: NonOccuringWindowRange[];
};
