import type { ActiveScheduleDays } from "../../domain/entity/ActiveScheduleDays";
import type { OccuringTimeWindow } from "../../domain/entity/OccurinngTimeWindow";
import type { CreateActiveScheduleDaysInput } from "../CreateActiveScheduleDaysInput";
import type { CreateActiveScheduleInput } from "../CreateActiveScheduleInput";

export type DayTypeOccuringActivation = {
  activeSchedule: CreateActiveScheduleInput;
  days: CreateActiveScheduleDaysInput[];
  occuringOverflow: OccuringTimeWindow;
};
