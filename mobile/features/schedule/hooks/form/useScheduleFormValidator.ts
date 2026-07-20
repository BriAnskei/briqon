import { useMemo } from "react";
import { NewScheduleFormState } from "@/type/NewScheduleTypes";
import ScheduleFormWindowtimeRuleValidator from "../../validators/ScheduleFormWindowtimeRuleValidator";
import ScheduleConflictValidator from "../../validators/ScheduleConflictValidator";
import EventScheduleValidator from "../../validators/EventScheduleValidator";
import { ValidatorResType } from "../../types/FormValidatorTypes";

export type FixedScheduleDuration = {
	appMinutes: number;
	mealMinutes: number;
	overAllMinutes: number;
};

export type WizardValidationResult = {
	isAllValid: boolean;
	appointments: ValidatorResType;
	meals: ValidatorResType;
	breaks: ValidatorResType;
	priorityTime: ValidatorResType;
	windowTime: ValidatorResType;
	conflicts: ValidatorResType;
	timeBlockRange: ValidatorResType;
	eventItemsPresent: ValidatorResType;
	eventDuration: ValidatorResType;
	eventConflicts: ValidatorResType;
};

type UseWizardValidationParams = {
	form: NewScheduleFormState;
	step: number;
	isEvent: boolean;
};

/**
 * Central place for every "is this wizard form state valid" concern.
 * Wraps the window-time rule validator (durations vs. the schedule window),
 * the conflict validator (overlapping appointments/fixed meals), and the
 * event validator (event-segment durations vs. the window) behind one hook so
 * screens/hooks that just need pass/fail + a message don't have to know three
 * validator classes exist.
 */
export function useWizardValidation({
	form,
	step,
	isEvent,
}: UseWizardValidationParams) {
	const validator = useMemo(
		() => new ScheduleFormWindowtimeRuleValidator(form),
		[form],
	);

	const conflictValidator = useMemo(
		() => new ScheduleConflictValidator(form),
		[form],
	);

	const eventValidator = useMemo(
		() => new EventScheduleValidator(form),
		[form],
	);

	const fixedScheduleDuration: FixedScheduleDuration = useMemo(
		() => ({
			appMinutes: validator.getAppointmentsTotalMinutes() ?? 0,
			mealMinutes: validator.getMealsTotalMinutes() ?? 0,
			overAllMinutes: validator.getPersonalOverallMinutes() ?? 0,
		}),
		[validator],
	);

	const validation: WizardValidationResult = useMemo(() => {
		const appointments = validator.validateAppWindowTime();
		const meals = validator.validateMealWindowTime();
		const breaks = validator.validateBreakFreqWindow();
		const priorityTime = validator.validatePriorityTimeWindow();
		const windowTime = validator.validateWindowMinDuration();
		const conflicts = conflictValidator.validateTimeConflicts();
		const timeBlockRange = conflictValidator.validateTimeBlocksWithinWindow();
		const eventItemsPresent = eventValidator.validateEventItemsPresent();
		const eventDuration = eventValidator.validateEventDurationWindow();
		const eventConflicts = eventValidator.validateEventConflicts();

		const isAllValid = [
			appointments,
			meals,
			breaks,
			priorityTime,
			windowTime,
			conflicts,
			timeBlockRange,
			eventItemsPresent,
			eventDuration,
			eventConflicts,
		].every((d) => d.valid);

		return {
			isAllValid,
			appointments,
			meals,
			breaks,
			priorityTime,
			windowTime,
			conflicts,
			timeBlockRange,
			eventItemsPresent,
			eventDuration,
			eventConflicts,
		};
	}, [validator, conflictValidator, eventValidator]);

	const stepError = useMemo(() => {
		if (validation.isAllValid) return undefined;

		if (isEvent) {
			// Event flow: event-schedule validation lives on the items step
			// (step 3 after the time step was split out from the details step).
			if (step === 3) {
				const errors = [
					!validation.eventItemsPresent.valid &&
						validation.eventItemsPresent.message,
					!validation.eventDuration.valid && validation.eventDuration.message,
					!validation.eventConflicts.valid && validation.eventConflicts.message,
				].filter(Boolean);

				return errors.length > 0 ? errors.join("\n") : undefined;
			}

			return undefined;
		} else {
			if (step === 1) {
				// Time-window step: the window itself is the only input here.
				return !validation.windowTime.valid
					? validation.windowTime.message
					: undefined;
			}

			if (step === 2) {
				// Appointments step: appointment validity plus any conflicts / window
				// violations (fixed-time meals count as time blocks too).
				const errors = [
					!validation.appointments.valid && validation.appointments.message,
					!validation.conflicts.valid && validation.conflicts.message,
					!validation.timeBlockRange.valid && validation.timeBlockRange.message,
				].filter(Boolean);

				return errors.length > 0 ? errors.join("\n") : undefined;
			}

			if (step === 3) {
				// Meals step: meal validity plus any conflicts / window violations.
				const errors = [
					!validation.meals.valid && validation.meals.message,
					!validation.conflicts.valid && validation.conflicts.message,
					!validation.timeBlockRange.valid && validation.timeBlockRange.message,
				].filter(Boolean);

				return errors.length > 0 ? errors.join("\n") : undefined;
			}

			if (step === 4) {
				return !validation.breaks.valid ? validation.breaks.message : undefined;
			}

			if (step === 5) {
				return !validation.priorityTime.valid
					? validation.priorityTime.message
					: undefined;
			}
		}

		return undefined;
	}, [validation, step, isEvent]);

	return {
		validator,
		conflictValidator,
		eventValidator,
		fixedScheduleDuration,
		validation,
		stepError,
	};
}
