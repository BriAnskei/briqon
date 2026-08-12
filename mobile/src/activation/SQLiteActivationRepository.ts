import { CreationPayload } from "@/type/services/activationService.types";
import { ActiveScheduleDatesRepository } from "../repository/active-schedule-dates.repository";
import { ActiveScheduleRepository } from "../repository/activeSchedule.repo";
import { ActiveScheduleDaysRepository } from "../repository/activeScheduleDays.repo";
import { ScheduleRepository } from "../repository/schedule.repository";
import { ActivationRepository } from "./ActivationRepository";
import { ulid } from "ulid";
import { SQLiteDatabase } from "expo-sqlite";

export class SQLiteActivationRepository implements ActivationRepository {
  constructor(
    private readonly repo: ActiveScheduleRepository,
    private readonly scheduleRepo: ScheduleRepository,
    private readonly activeScheduleDaysRepo: ActiveScheduleDaysRepository,
    private readonly activeScheduleDateRepo: ActiveScheduleDatesRepository,
  ) {}

  async create(payload: CreationPayload): Promise<void> {
    const activeScheduleId = ulid();

    await this.repo.transaction(async (db) => {
      if (payload.isScheduleNeedsToSave && payload.newSchedule) {
        await this.scheduleRepo.create(payload.newSchedule, db);
      }

      await this.repo.create({ ...payload.newActiveSchedule, id: activeScheduleId }, db);

      await this.persistActiveType(payload, activeScheduleId, db);
    });
  }

  private async persistActiveType(
    payload: CreationPayload,
    activeScheduleId: string,
    db: SQLiteDatabase,
  ) {
    if (payload.newActiveSchedule.active_type === "days") {
      await this.createSelectedDays(payload.selectedDays ?? [], activeScheduleId, db);

      return;
    }

    if (payload.newActiveSchedule.active_type === "date") {
      if (!payload.selectedDate) {
        throw new Error("No data for the date selection");
      }

      await this.createDate(payload.selectedDate, activeScheduleId, db);
    }
  }

  private async createSelectedDays(
    selectedDays: number[],
    activeScheduleId: string,
    db: SQLiteDatabase,
  ) {}
  private async createDate(selectedDate: Date, activeScheduleId: string, db: SQLiteDatabase) {}
}
