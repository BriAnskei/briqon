import { ActiveSchedule } from "../models/active_schedule.model";

export type ConflictContext<T> = {
	conflicts: Array<{
		activeSchedule: ActiveSchedule;
		data: T;
		scheduleName: string;
	}>;
};

export abstract class ScheduleActivationError<T> extends Error {
	constructor(
		message: string,
		public readonly context: T,
	) {
		super(message);
	}
}
