import type { ActiveType } from "./ActiveType";

export interface CreateActivationData {
  scheduleId: string;
  activeType: ActiveType;
  reccuring: boolean;
}
