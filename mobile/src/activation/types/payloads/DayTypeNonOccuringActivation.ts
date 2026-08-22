import type { NonOccuringWindowRange } from "../../domain/entity/NonOccuringWindowRange";
import type { CreateActiveScheduleDaysInput } from "../CreateActiveScheduleDaysInput";

export type DayTypeNonOccuringActivation = {
  days: CreateActiveScheduleDaysInput[];
  ranges: NonOccuringWindowRange[];
};
