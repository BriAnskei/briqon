import type { ActiveScheduleDays } from "../domain/entity/ActiveScheduleDays";
import type { NonOccuringWindowRange } from "../domain/entity/NonOccuringWindowRange";

export type DayTypeNonOccuringActivation = {
  days: ActiveScheduleDays[];
  ranges: NonOccuringWindowRange[];
};
