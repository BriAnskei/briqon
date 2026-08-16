import type { ActiveScheduleDays } from "../domain/entity/ActiveScheduleDays";
import type { OccuringOverflow } from "../domain/entity/OccuringOverflow";

export type DayTypeOccuringActivation = {
  days: ActiveScheduleDays[];
  occuringOverflow: OccuringOverflow;
};
