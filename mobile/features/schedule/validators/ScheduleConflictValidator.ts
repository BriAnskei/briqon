import { MealPlacement, NewScheduleFormState } from "@/type/NewScheduleTypes";
import { ValidatorResType } from "../types/FormValidatorTypes";
import { getMinutesOfDay, normalizeMinute } from "@/utils/TimeFormatter";

type TimeBlock = {
	id: string;
	label: string;
	start: Date;
	end: Date;
};

export default class ScheduleConflictValidator {
	constructor(private form: NewScheduleFormState) {}

	public validateTimeConflicts(): ValidatorResType {
		const blocks = this.getTimeBlocks();

		if (blocks.length <= 1) {
			return { valid: true };
		}

		const sorted = [...blocks].sort(
			(a, b) => a.start.getTime() - b.start.getTime(),
		);

		for (let i = 0; i < sorted.length - 1; i++) {
			const current = sorted[i];
			const next = sorted[i + 1];

			if (this.isOverlapping(current, next)) {
				return {
					valid: false,
					message: `"${current.label}" conflicts with "${next.label}".`,
				};
			}
		}

		return { valid: true };
	}

	public validateTimeBlocksWithinWindow(): ValidatorResType {
		const blocks = this.getTimeBlocks();

		const windowStart = getMinutesOfDay(this.form.startTime);
		const windowEnd = windowStart + this.getWindowMinutes();

		for (const block of blocks) {
			let start = normalizeMinute(
				getMinutesOfDay(block.start),
				windowStart,
			);

			let end = normalizeMinute(
				getMinutesOfDay(block.end),
				windowStart,
			);

			// Handle appointments/meals that cross midnight.
			if (end <= start) {
				end += 24 * 60;
			}

			if (start < windowStart || end > windowEnd) {
				return {
					valid: false,
					message: `"${block.label}" is outside the schedule time window.`,
				};
			}
		}

		return { valid: true };
	}

	/**
	 * Convert appointments and fixed meals into one
	 * collection of time blocks.
	 */
	private getTimeBlocks(): TimeBlock[] {
		const appointments: TimeBlock[] = this.form.appointments.map((app) => ({
			id: app.id,
			label:
				app.type === "custom"
					? app.customLabel || "Custom appointment"
					: app.type,
			start: app.startTime,
			end: app.endTime,
		}));

		const fixedMeals: TimeBlock[] = this.form.meals
			.filter((meal) => meal.placement === "fixed_time" && meal.fixedTime)
			.map((meal) => ({
				id: meal.id,
				label: meal.type,
				start: meal.fixedTime!,
				end: new Date(
					meal.fixedTime!.getTime() + meal.durationMinutes * 60 * 1000,
				),
			}));

		return [...appointments, ...fixedMeals];
	}

	private isOverlapping(a: TimeBlock, b: TimeBlock): boolean {
		return a.end.getTime() > b.start.getTime();
	}

	/** Total minutes spanned by the schedule window (mirrors the window validator). */
	public getWindowMinutes(): number {
		const { startTime, endTime } = this.form;
		let diff = endTime.getTime() - startTime.getTime();

		// Equal times (12am -> 12am) and clock-wraparound (10pm -> 6am) both mean
		// "the window extends into the next day" -- treat both as a full 24h cycle.
		if (diff <= 0) diff += 24 * 60 * 60 * 1000;

		return Math.floor(diff / (1000 * 60));
	}
}
