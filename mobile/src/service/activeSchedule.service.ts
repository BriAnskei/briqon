import type { SQLiteDatabase } from "expo-sqlite";
import { ulid } from "ulid";
import { id } from "zod/v4/locales";
import {
	type ScheduleConflict,
	ScheduleConflictError,
} from "../errors/scheduleActivationConflic.error";
import {
	type ActiveScheduleDates,
	type CreateActiveScheduleDates,
	CreateActiveScheduleDatesSchema,
} from "../models/active_schedule_dates.model";
import {
	type ActiveScheduleDays,
	type CreateActiveScheduleDays,
	CreateActiveScheduleDaysSchema,
} from "../models/active_schedule_days.model";
import {
	type ActiveSchedule,
	CreateActivecheduleSchema,
	type CreateActiveSchedule,
} from "../models/activeSchedule.model";
import { buildEntity } from "../models/factories/base.factory";
import {
	type CreateSchedule,
	CreateScheduleSchema,
} from "../models/schedule.model";
import { ActiveScheduleDatesRepository } from "../repository/active-schedule-dates.repository";
import { ActiveScheduleRepository } from "../repository/activeSchedule.repo";
import { ActiveScheduleDaysRepository } from "../repository/activeScheduleDays.repo";
import { ScheduleRepository } from "../repository/schedule.repository";

type CreationPayload = {
	newActiveSchedule: ActiveSchedule;
	selectedDays: number[];
	selectedDate: Date;
};

export class ActiveScheduleService {
	private repo = new ActiveScheduleRepository();
	private scheduleRepo = new ScheduleRepository();
	private activeScheduleDaysRepo = new ActiveScheduleDaysRepository();
	private activeScheduleDateRepo = new ActiveScheduleDatesRepository();

	async createAsync(payload: CreationPayload, overWrite?: boolean) {
		const { recurringConflict, nonRecurringConflict } =
			await this.checkScheduleActivationConflicts(payload);

		if (
			!overWrite &&
			(recurringConflict.length > 0 || nonRecurringConflict.length > 0)
		) {
			const overAllConflictArr = [
				...recurringConflict,
				...nonRecurringConflict,
			];
			throw new ScheduleConflictError(
				`The activation contains ${overAllConflictArr.length} conflicts`,
				overAllConflictArr,
			);
		}

		await this.resolveActivationConflicts({
			recurringConflict,
			nonRecurringConflict,
			isNewActiveRecurring: payload.newActiveSchedule.recurring,
			newActiveScheduleDays: payload.selectedDays,
		});

		const activeScheduleId = ulid();

		this.repo.transaction(async (db) => {
			this.repo.create(payload.newActiveSchedule, db);

			if (payload.newActiveSchedule.active_type === "days") {
				const activeDays: ActiveScheduleDays[] = (
					payload.selectedDays ?? []
				).map((d) => ({
					id: ulid(),
					active_schedule_id: activeScheduleId,
					weekday: d,
				}));

				this.activeScheduleDaysRepo.create(activeDays, db);
			} else if (payload.newActiveSchedule.active_type === "date") {
				const activeDate: ActiveScheduleDates = {
					id: ulid(),
					active_schedule_id: activeScheduleId,
					date: payload.selectedDate,
				};

				this.activeScheduleDateRepo.create(activeDate, db);
			}
		});
	}

	private async checkScheduleActivationConflicts(
		payload: CreationPayload,
	): Promise<{
		recurringConflict: ScheduleConflict[];
		nonRecurringConflict: ScheduleConflict[];
	}> {
		const { starts_at, ends_at, recurring } = payload.newActiveSchedule;

		let dayRangeConflict: ScheduleConflict[] = [];
		// this will usually return a data if the new active schedule
		// is non repeating and it has a non repeating conflicts
		const rangeConflicts = await this.repo.findRangeOverlaps(
			starts_at?.toISOString(),
			ends_at?.toISOString(),
		);

		if (recurring) {
			dayRangeConflict = await this.repo.findDayConflicts(payload.selectedDays);
		}

		return {
			recurringConflict: dayRangeConflict,
			nonRecurringConflict: rangeConflicts,
		};
	}

	/** drops conflicted day/s only  or drops conflicted active schedule direclty
  if alldays(selected days type) are conflicted or if the active type is date
  handles ordering proccess
  */
	private async resolveActivationConflicts(payload: {
		recurringConflict: ScheduleConflict[];
		nonRecurringConflict: ScheduleConflict[];
		isNewActiveRecurring: boolean;
		newActiveScheduleDays?: number[];
	}): Promise<void> {
		const {
			recurringConflict,
			nonRecurringConflict,
			isNewActiveRecurring,
			newActiveScheduleDays,
		} = payload;

		const overAllConflictArr: ScheduleConflict[] = [
			...(!isNewActiveRecurring ? [] : recurringConflict),
			...nonRecurringConflict,
		];

		for (const conflict of overAllConflictArr) {
			// delete selected days
			if (conflict.activeType === "date") {
				this.repo.delete(conflict.id);
			} else if (conflict.activeType === "days") {
				const ramainingDays =
					conflict.selectedDays ??
					[].filter((d) => !(newActiveScheduleDays ?? []).includes(d));

				if (ramainingDays.length === 0) this.repo.delete(conflict.id);
				else {
					await this.activeScheduleDaysRepo.removeActiveScheduleDays(
						conflict.id,
						conflict.selectedDays ?? [],
					);
				}
			}
		}
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

		return {
			validatedSchedule,
			validatedActiveSchedule,

			dayOfWeeks,
			date,
		};
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
		for (const day of daysOfWeeks) {
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
