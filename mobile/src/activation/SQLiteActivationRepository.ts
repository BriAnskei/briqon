import type * as SQLite from "expo-sqlite";
import type { ActiveScheduleDatesRepository } from "../repository/active-schedule-dates.repository";
import type { ActiveScheduleRepository } from "../repository/activeSchedule.repo";
import type { ActiveScheduleDaysRepository } from "../repository/activeScheduleDays.repo";
import type { ScheduleRepository } from "../repository/schedule.repository";
import type { ActivationRepository } from "./ActivationRepository";
import type { Activation } from "./domain/Activation";
import type { ActiveScheduleDays } from "./domain/entity/ActiveScheduleDays";
import type { OccuringTimeWindow } from "./domain/entity/OccurinngTimeWindow";
import type { CreateActiveScheduleInput } from "./types/CreateActiveScheduleInput";
import type { DayTypeNonOccuringActivation } from "./types/payloads/DayTypeNonOccuringActivation";

export class SQLiteActivationRepository implements ActivationRepository {
  constructor(
    private readonly repo: ActiveScheduleRepository,
    private readonly scheduleRepo: ScheduleRepository,
    private readonly activeScheduleDaysRepo: ActiveScheduleDaysRepository,
    private readonly activeScheduleDateRepo: ActiveScheduleDatesRepository,
  ) {}

  async create(payload: Activation): Promise<void> {
    await this.repo.transaction(async (db) => {});
  }

  private async handleOccuring(payload: DayTypeNonOccuringActivation): Promise<void> {}

  private async persistActivation(
    activeSchedule: CreateActiveScheduleInput,
    db: SQLite.SQLiteDatabase,
  ) {
    await this.repo.create(activeSchedule, db);
  }

  private async persistDays(
    activeScheduleDays: ActiveScheduleDays,
    db: SQLite.SQLiteDatabase,
  ): Promise<void> {}

  private async persistOccuringtimeWindow(payload: OccuringTimeWindow): Promise<void> {
    
}
}
