export type ActiveType = "days" | "date";

export interface CreateActivationData {
  scheduleId: string;
  activeType: ActiveType;
  reccuring: boolean;
}
