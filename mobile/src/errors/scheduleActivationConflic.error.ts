import type { ActiveSchedule } from "../models/activeSchedule.model";
import { BaseError } from "./business.error";

export type ScheduleConflict = {
	id: string;
	scheduleName: string;
	scheduleId: string;
	activeType: ActiveSchedule["active_type"];
	recurring: boolean;

	startsAt?: Date;
	endsAt?: Date;

	selectedDays?: number[];
	selectedDate?: string;
};



export class ScheduleConflictError extends BaseError<ScheduleConflict[]> {}
