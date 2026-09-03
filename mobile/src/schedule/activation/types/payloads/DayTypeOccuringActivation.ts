import type { OccuringTimeWindow } from "../../domain/entity/OccurinngTimeWindow";
import type { CreateActiveScheduleDaysInput } from "../CreateActiveScheduleDaysInput";

export type DayTypeOccuringActivation = {
  days: CreateActiveScheduleDaysInput[];
  occuringTimeWindow: OccuringTimeWindow;
};
