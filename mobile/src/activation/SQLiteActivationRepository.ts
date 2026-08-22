import type * as SQLite from "expo-sqlite";
import type { ActiveScheduleDatesRepository } from "../repository/active-schedule-dates.repository";
import type { ActiveScheduleRepository } from "../repository/activeSchedule.repo";
import type { ActiveScheduleDaysRepository } from "../repository/activeScheduleDays.repo";
import type { NonReccurringRangeRepository } from "../repository/non_reccuring_range.repo";
import type { OccurringTimeWindowRepository } from "../repository/occuring-time-window.repo";
import type { ActivationRepository } from "./ActivationRepository";
import type { Activation } from "./domain/Activation";
import type { ActiveScheduleDate } from "./domain/entity/ActiveScheduleDate";
import type { ActiveScheduleDays } from "./domain/entity/ActiveScheduleDays";
import type { NonOccuringWindowRange } from "./domain/entity/NonOccuringWindowRange";
import type { OccuringTimeWindow } from "./domain/entity/OccurinngTimeWindow";
import type { DateTypeActivation } from "./types/payloads/DateTypeActivation";
import type { DayTypeNonOccuringActivation } from "./types/payloads/DayTypeNonOccuringActivation";
import type { DayTypeOccuringActivation } from "./types/payloads/DayTypeOccuringActivation";

export class SQLiteActivationRepository implements ActivationRepository {
  constructor(
    private readonly repo: ActiveScheduleRepository,
    private readonly activeScheduleDaysRepo: ActiveScheduleDaysRepository,
    private readonly activeScheduleDateRepo: ActiveScheduleDatesRepository,
    private readonly occuringTimeWindowRepo: OccurringTimeWindowRepository,
    private readonly nonReccuringRangeRepo: NonReccurringRangeRepository,
  ) {}

  async execute(payload: Activation): Promise<void> {
    await this.repo.transaction(async (db) => {
      await this.repo.create(payload.getActiveSchedule(), db);

      if (payload.activeType === "days" && !payload.reccuring)
        await this.handleDayTypeNonOccuring(payload.getDayTypeNonOccuring(), db);
      else if (payload.activeType === "days" && payload.reccuring)
        await this.handleDayTypeOccuring(payload.getDayTypeOccuring(), db);
      else if (payload.activeType === "date")
        await this.handleDateType(payload.getDateType(), db);
    });
  }

  // type handler
  private async handleDayTypeNonOccuring(
    payload: DayTypeNonOccuringActivation,
    db: SQLite.SQLiteDatabase,
  ): Promise<void> {
    const { days, ranges } = payload;
    await this.persistDays(days, db);
    await this.persistNonOccuringRanges(ranges, db);
  }

  private async handleDayTypeOccuring(
    payload: DayTypeOccuringActivation,
    db: SQLite.SQLiteDatabase,
  ): Promise<void> {
    const { days, occuringTimeWindow } = payload;
    await this.persistDays(days, db);
    await this.persistOccuringtimeWindow(occuringTimeWindow, db);
  }

  private async handleDateType(
    payload: DateTypeActivation,
    db: SQLite.SQLiteDatabase,
  ): Promise<void> {
    const { date, range } = payload;
    await this.persistDate(date, db);
    await this.persistNonOccuringRanges([range], db);
  }

  // active type
  private async persistDays(
    activeScheduleDays: ActiveScheduleDays[],
    db: SQLite.SQLiteDatabase,
  ): Promise<void> {
    await this.activeScheduleDaysRepo.create(activeScheduleDays, db);
  }

  private async persistDate(
    activeScheduleDate: ActiveScheduleDate,
    db: SQLite.SQLiteDatabase,
  ): Promise<void> {
    await this.activeScheduleDateRepo.create(activeScheduleDate, db);
  }

  // contract handler
  private async persistOccuringtimeWindow(
    payload: OccuringTimeWindow,
    db: SQLite.SQLiteDatabase,
  ): Promise<void> {
    await this.occuringTimeWindowRepo.create(payload, db);
  }

  private async persistNonOccuringRanges(
    payloads: NonOccuringWindowRange[],
    db: SQLite.SQLiteDatabase,
  ): Promise<void> {
    await this.nonReccuringRangeRepo.create(payloads, db);
  }
}
