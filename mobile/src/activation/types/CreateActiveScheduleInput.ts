import type { ActiveType } from "./ActiveType";

export interface CreateActiveScheduleInput {
  id: string;
  scheduleId: string;
  activeType: ActiveType;
  reccuring: boolean;
}
