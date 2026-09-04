import type { ScheduleCard } from "@/type/ui/schedule/scheduleUI.types";

export interface ScheduleQueryRepository {
  fetchCards(): Promise<ScheduleCard[]>;
}
