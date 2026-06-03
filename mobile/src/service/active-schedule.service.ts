import { validate } from "@/utils/zod/schemaValidator";
import { ActiveScheduleRepository } from "../repository/active-schedule.repository";
import {
  ActiveSchedule,
  CreateActivecheduleSchema,
  CreateActiveSchedule,
  CreateActiveScheduleEntity,
} from "../models/active_schedule.model";
import { ulid } from "ulid";
import { ScheduleRepository } from "../repository/schedule.repository";
import {
  CreateSchedule,
  CreateScheduleSchema,
  Schedule,
} from "../models/schedule.model";
import {
  ActiveScheduleDays,
  CreateActiveScheduleDays,
  CreateActiveScheduleDaysSchema,
} from "../models/active_schedule_days.model";
import { ActiveScheduleDaysRepository } from "../repository/active-schedule-days.repository";
import {
  ActiveScheduleDates,
  ActiveSheduleDatesSchema,
  CreateActiveScheduleDates,
  CreateActiveScheduleDatesSchema,
} from "../models/active_schedule_dates.model";
import { ActiveScheduleDatesRepository } from "../repository/active-schedule-dates.repository";
import { buildEntity } from "../models/factories/base.factory";
import { SQLiteDatabase } from "expo-sqlite";

export class ActiveScheduleService {
  private repo = new ActiveScheduleRepository();
  private scheduleRepo = new ScheduleRepository();
  private activeScheduleDaysRepo = new ActiveScheduleDaysRepository();
  private activeScheduleDateRepo = new ActiveScheduleDatesRepository();

  async createActiveSchedule(payload: {
    activeSchedule: CreateActiveSchedule;
    schedule: CreateSchedule;
    dayOfWeeks?: number[]; // number[]
    date?: Date; // date
  }) {
    const { validatedSchedule, validatedActiveSchedule, dayOfWeeks, date } =
      this.validateActivationPayload(payload);

    // build objects
    const scheduleEntity = buildEntity(validatedSchedule);
    const activeScheduleEntity = buildEntity(
      validatedActiveSchedule as CreateActiveScheduleEntity,
      {
        schedule_id: scheduleEntity.id,
      },
    );

    this.repo.transaction(async (db) => {
      await this.repo.create(activeScheduleEntity, db);
      await this.scheduleRepo.create(scheduleEntity, db);

      this.handleActiveTypePersistence({
        dayOfWeeks,
        date,
        activeScheduleId: activeScheduleEntity.id,
        activeScheduleType: activeScheduleEntity.active_type,
        db,
      });
    });
  }

  private validateActivationPayload(payload: {
    activeSchedule: CreateActiveSchedule;
    schedule: CreateSchedule;
    dayOfWeeks?: number[]; // number[]
    date?: Date; // date
  }) {
    const { activeSchedule, schedule, dayOfWeeks, date } = payload;
    const validatedSchedule = validate(CreateScheduleSchema, schedule);
    const validatedActiveSchedule = validate(
      CreateActivecheduleSchema,
      activeSchedule,
    );

    return { validatedSchedule, validatedActiveSchedule, dayOfWeeks, date };
  }

  private async handleActiveTypePersistence(payload: {
    dayOfWeeks?: number[];
    date?: Date;
    activeScheduleId: string;
    activeScheduleType: "date" | "days";
    db: SQLiteDatabase;
  }) {
    const { dayOfWeeks, date, activeScheduleId, activeScheduleType, db } =
      payload;

    if (activeScheduleType === "date") {
      await this.createDateOfActiveSchedule(date!, activeScheduleId, db);
    } else if (activeScheduleType === "days") {
      await this.createSelectedDaysOfActiveSchedule(
        dayOfWeeks!,
        activeScheduleId,
        db,
      );
    }
  }

  private async createDateOfActiveSchedule(
    date: Date,
    activeScheduleId: string,
    db: SQLiteDatabase,
  ) {
    const activeScheduleDate: CreateActiveScheduleDates = {
      active_schedule_id: activeScheduleId,
      date,
    };

    const validatedActiveScheduleDate = validate(
      CreateActiveScheduleDatesSchema,
      activeScheduleDate,
    );

    const activeScheduleDateEntity = buildEntity(validatedActiveScheduleDate);

    await this.activeScheduleDateRepo.create(activeScheduleDateEntity, db);
  }

  private async createSelectedDaysOfActiveSchedule(
    daysOfWeeks: number[],
    activeScheduleId: string,
    db: SQLiteDatabase,
  ) {
    for (let day of daysOfWeeks) {
      const activeScheduleDay: CreateActiveScheduleDays = {
        active_schedule_id: activeScheduleId,
        weekday: day,
      };

      const validatedActiveScheduleDays = validate(
        CreateActiveScheduleDaysSchema,
        activeScheduleDay,
      );

      const activeScheduleDayEntity = buildEntity(validatedActiveScheduleDays);

      await this.activeScheduleDaysRepo.create(activeScheduleDayEntity, db);
    }
  }

  async findById(id: string) {
    const result = await this.repo.findById(id);
    return result;
  }

  async findAll() {
    const results = await this.repo.findAll();
    return results;
  }

  async updateActiveSchedule(id: string, input: unknown) {
    const validatedRawInput = validate(CreateActivecheduleSchema, input);

    const updated = await this.repo.update(id, validatedRawInput);

    return updated;
  }

  async deleteActiveSchedule(id: string) {
    await this.repo.delete(id);
    return { success: true };
  }
}
