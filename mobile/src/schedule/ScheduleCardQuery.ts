import type { ScheduleCard } from "@/type/ui/schedule/scheduleUI.types";
import type { SQLiteScheduleCardQueryRepository } from "./SQLiteScheduleCardQueryRepository";

export class ScheduleCardQuery {
  constructor(
    private readonly sqliteScheduleCardQueryRepository: SQLiteScheduleCardQueryRepository,
  ) {}

  async getAll(): Promise<ScheduleCard[]> {
    return await this.sqliteScheduleCardQueryRepository.fetchCards();
  }
}
