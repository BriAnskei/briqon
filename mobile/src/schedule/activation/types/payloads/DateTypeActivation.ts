import type { ActiveScheduleDate } from "../../domain/entity/ActiveScheduleDate";
import type { NonOccuringWindowRange } from "../../domain/entity/NonOccuringWindowRange";

export type DateTypeActivation = {
  date: ActiveScheduleDate;
  range: NonOccuringWindowRange;
};
