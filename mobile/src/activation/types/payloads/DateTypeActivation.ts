import type { ActiveScheduleDate } from "../../domain/entity/ActiveScheduleDate";
import type { NonOccuringWindowRange } from "../../domain/entity/NonOccuringWindowRange";
import type { CreateActiveScheduleInput } from "../CreateActiveScheduleInput";

export type DateTypeActivation = {
  activeSchedule: CreateActiveScheduleInput;
  date: ActiveScheduleDate;
  range: NonOccuringWindowRange;
};
