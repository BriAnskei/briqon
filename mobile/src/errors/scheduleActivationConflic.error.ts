import { ScheduleActivationError, ConflictContext } from "./business.error";

export type ConflictActivationContext = ConflictContext<Date | number[]>;

export class ConflicActivationError extends ScheduleActivationError<ConflictActivationContext> {
	constructor(context: ConflictActivationContext) {
		super(
			"Schedule activation conflict with an existing active schedule",
			context,
		);
	}
}
