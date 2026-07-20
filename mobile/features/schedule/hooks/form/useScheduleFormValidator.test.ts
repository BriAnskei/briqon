import { renderHook } from "@testing-library/react-native";

import type {
	Appointment,
	AppointmentType,
	Meals,
	MealPlacement,
	MealType,
	NewScheduleFormState,
} from "@/type/NewScheduleTypes";
import { useWizardValidation } from "./useScheduleFormValidator";

describe("useWizardValidation", () => {
	const baseForm: NewScheduleFormState = {
		scheduleType: "personal",
		startTime: new Date("2026-07-07T08:00:00"),
		endTime: new Date("2026-07-07T20:00:00"), // 12h / 720min window
		showStartPicker: false,
		showEndPicker: false,
		appointments: [],
		meals: [],
		breakFrequency: "balanced",
		priorityFocusText: "",
		priorityDurationMinutes: null,
		eventType: null,
		eventOtherLabel: "",
		eventScheduleItems: [],
	};

	function appt(
		id: string,
		type: AppointmentType,
		start: string,
		end: string,
		customLabel = "",
	): Appointment {
		return {
			id,
			type,
			customLabel,
			startTime: new Date(`2026-07-07T${start}:00`),
			endTime: new Date(`2026-07-07T${end}:00`),
		};
	}

	function meal(
		id: string,
		type: MealType,
		durationMinutes: number,
		placement: MealPlacement,
		fixedTime?: string,
	): Meals {
		return {
			id,
			type,
			durationMinutes,
			placement,
			fixedTime: fixedTime ? new Date(`2026-07-07T${fixedTime}:00`) : undefined,
		};
	}

	function setup(form: NewScheduleFormState, step: number, isEvent = false) {
		return renderHook(
			(props: { form: NewScheduleFormState; step: number; isEvent: boolean }) =>
				useWizardValidation(props),
			{ initialProps: { form, step, isEvent } },
		);
	}

	// ---------------------------------------------------------------------
	// Baseline / aggregation behavior
	// ---------------------------------------------------------------------

	it("is fully valid for a form with no appointments, meals, or priority focus", () => {
		const { result } = setup(baseForm, 1);
		expect(result.current.validation.isAllValid).toBe(true);
		expect(result.current.stepError).toBeUndefined();
	});

	it("exposes the underlying validator and conflictValidator instances", () => {
		const { result } = setup(baseForm, 1);
		expect(result.current.validator).toBeDefined();
		expect(result.current.conflictValidator).toBeDefined();
	});

	it("computes fixedScheduleDuration from appointment and meal minutes", () => {
		const form: NewScheduleFormState = {
			...baseForm,
			appointments: [
				appt("a1", "work", "09:00", "10:00"), // 60 min
				appt("a2", "medical", "10:30", "11:00"), // 30 min
			],
			meals: [
				meal("m1", "breakfast", 30, "flexible"),
				meal("m2", "lunch", 45, "fixed_time", "12:00"),
			],
		};
		const { result } = setup(form, 1);

		expect(result.current.fixedScheduleDuration).toEqual({
			appMinutes: 90,
			mealMinutes: 75,
			overAllMinutes: 165,
		});
	});

	// ---------------------------------------------------------------------
	// isEvent bypass
	// ---------------------------------------------------------------------

	it("never surfaces a stepError when isEvent is true, even with invalid data", () => {
		const form: NewScheduleFormState = {
			...baseForm,
			appointments: [
				appt("a1", "work", "08:00", "18:00"),
				appt("a2", "medical", "09:00", "19:00"), // overlaps a1
			],
		};
		const { result } = setup(form, 1, true);

		expect(result.current.validation.isAllValid).toBe(false);
		expect(result.current.stepError).toBeUndefined();
	});

	// ---------------------------------------------------------------------
	// Step 1: appointments / meals / conflicts / timeBlockRange
	// ---------------------------------------------------------------------

	it("returns undefined stepError on step 1 when only step-1-irrelevant validators fail", () => {
		// A priority duration that exceeds the remaining window makes
		// validatePriorityTimeWindow fail, driving isAllValid to false, but
		// priorityTime isn't one of the messages step 1 surfaces -- so
		// stepError stays undefined even though the form is globally invalid.
		const form: NewScheduleFormState = {
			...baseForm,
			priorityDurationMinutes: 1000, // > 720min window
		};
		const { result } = setup(form, 1);

		expect(result.current.validation.isAllValid).toBe(false);
		expect(result.current.validation.priorityTime.valid).toBe(false);
		expect(result.current.stepError).toBeUndefined();
	});

	it("surfaces a single message on step 1 when only the conflict validator fails", () => {
		const form: NewScheduleFormState = {
			...baseForm,
			appointments: [
				appt("a1", "work", "09:00", "10:30"),
				appt("a2", "medical", "10:00", "11:00"),
			],
		};
		const { result } = setup(form, 1);

		expect(result.current.validation.conflicts.valid).toBe(false);
		expect(result.current.stepError).toBe(
			result.current.validation.conflicts.message,
		);
	});

	it("joins multiple step-1 failures with a newline, in appointments/meals/conflicts/timeBlockRange order", () => {
		// Two large, overlapping appointments simultaneously blow past the
		// window (fails validateAppWindowTime) and conflict with each other
		// (fails validateTimeConflicts).
		const form: NewScheduleFormState = {
			...baseForm,
			appointments: [
				appt("a1", "work", "08:00", "18:00"), // 600 min
				appt("a2", "medical", "09:00", "19:00"), // 600 min, overlaps a1
			],
		};
		const { result } = setup(form, 1);
		const { appointments, conflicts, meals, timeBlockRange } =
			result.current.validation;

		expect(appointments.valid).toBe(false);
		expect(conflicts.valid).toBe(false);
		expect(meals.valid).toBe(true);
		expect(timeBlockRange.valid).toBe(true);

		expect(result.current.stepError).toBe(
			[appointments.message, conflicts.message].join("\n"),
		);
	});

	it("surfaces a timeBlockRange failure on step 1 when a block falls outside the window", () => {
		const form: NewScheduleFormState = {
			...baseForm,
			startTime: new Date("2026-07-07T08:00:00"),
			endTime: new Date("2026-07-07T20:00:00"),
			appointments: [appt("a1", "work", "06:00", "07:00")], // before window start
		};
		const { result } = setup(form, 1);

		expect(result.current.validation.timeBlockRange.valid).toBe(false);
		expect(result.current.stepError).toBe(
			result.current.validation.timeBlockRange.message,
		);
	});

	// ---------------------------------------------------------------------
	// Step 2: breaks only
	// ---------------------------------------------------------------------

	it("surfaces only the breaks message on step 2, ignoring other invalid validators", () => {
		const form: NewScheduleFormState = {
			...baseForm,
			// Fill almost the entire window with appointments so there's no
			// room left for the "balanced" break allotment.
			appointments: [appt("a1", "work", "08:00", "19:50")],
			breakFrequency: "balanced",
		};
		const { result } = setup(form, 2);

		expect(result.current.validation.breaks.valid).toBe(false);
		expect(result.current.stepError).toBe(
			result.current.validation.breaks.message,
		);
	});

	it("returns undefined stepError on step 2 when breaks are valid, even if other validators fail", () => {
		const form: NewScheduleFormState = {
			...baseForm,
			appointments: [
				appt("a1", "work", "09:00", "10:30"),
				appt("a2", "medical", "10:00", "11:00"), // conflicting, but irrelevant to step 2
			],
		};
		const { result } = setup(form, 2);

		expect(result.current.validation.conflicts.valid).toBe(false);
		expect(result.current.stepError).toBeUndefined();
	});

	// ---------------------------------------------------------------------
	// Step 3: priorityTime only
	// ---------------------------------------------------------------------

	it("surfaces only the priorityTime message on step 3", () => {
		const form: NewScheduleFormState = {
			...baseForm,
			appointments: [appt("a1", "work", "08:00", "19:00")], // 660 min used
			priorityDurationMinutes: 120, // more than the ~60 min left in a 720 min window
		};
		const { result } = setup(form, 3);

		expect(result.current.validation.priorityTime.valid).toBe(false);
		expect(result.current.stepError).toBe(
			result.current.validation.priorityTime.message,
		);
	});

	// ---------------------------------------------------------------------
	// Steps outside 1-3
	// ---------------------------------------------------------------------

	it("returns undefined stepError for steps with no defined error mapping (e.g. step 0 or 4)", () => {
		const form: NewScheduleFormState = {
			...baseForm,
			appointments: [
				appt("a1", "work", "08:00", "18:00"),
				appt("a2", "medical", "09:00", "19:00"),
			],
		};

		const stepZero = setup(form, 0);
		expect(stepZero.result.current.validation.isAllValid).toBe(false);
		expect(stepZero.result.current.stepError).toBeUndefined();

		const stepFour = setup(form, 4);
		expect(stepFour.result.current.stepError).toBeUndefined();
	});

	// ---------------------------------------------------------------------
	// Memoization
	// ---------------------------------------------------------------------

	it("keeps the same validator/conflictValidator instances across rerenders with the same form reference", () => {
		const { result, rerender } = setup(baseForm, 1);
		const firstValidator = result.current.validator;
		const firstConflictValidator = result.current.conflictValidator;

		rerender({ form: baseForm, step: 1, isEvent: false });

		expect(result.current.validator).toBe(firstValidator);
		expect(result.current.conflictValidator).toBe(firstConflictValidator);
	});

	it("creates new validator instances when the form reference changes, even with equal values", () => {
		const { result, rerender } = setup(baseForm, 1);
		const firstValidator = result.current.validator;
		const firstConflictValidator = result.current.conflictValidator;

		rerender({ form: { ...baseForm }, step: 1, isEvent: false });

		expect(result.current.validator).not.toBe(firstValidator);
		expect(result.current.conflictValidator).not.toBe(firstConflictValidator);
	});

	it("recomputes stepError when step changes but form stays the same", () => {
		const form: NewScheduleFormState = {
			...baseForm,
			appointments: [appt("a1", "work", "08:00", "19:50")],
			breakFrequency: "balanced",
			priorityDurationMinutes: 500,
		};
		const { result, rerender } = setup(form, 2);

		expect(result.current.stepError).toBe(
			result.current.validation.breaks.message,
		);

		rerender({ form, step: 3, isEvent: false });

		expect(result.current.stepError).toBe(
			result.current.validation.priorityTime.message,
		);
	});
	// ---------------------------------------------------------------------
	// Event schedule validation
	// ---------------------------------------------------------------------

	function eventItem(
		id: string,
		name: string,
		duration: string,
	): NewScheduleFormState["eventScheduleItems"][number] {
		return { id, name, duration };
	}

	it("exposes the underlying eventValidator instance", () => {
		const { result } = setup(baseForm, 1, true);
		expect(result.current.eventValidator).toBeDefined();
	});

	it("passes event validation for an empty event schedule", () => {
		const form: NewScheduleFormState = {
			...baseForm,
			scheduleType: "event",
			eventScheduleItems: [],
		};
		const { result } = setup(form, 1, true);
		expect(result.current.validation.eventItemsPresent.valid).toBe(true);
		expect(result.current.validation.eventDuration.valid).toBe(true);
		expect(result.current.validation.eventConflicts.valid).toBe(true);
		expect(result.current.validation.isAllValid).toBe(true);
		expect(result.current.stepError).toBeUndefined();
	});

	it("passes event validation when parseable segments fit the window", () => {
		const form: NewScheduleFormState = {
			...baseForm,
			scheduleType: "event",
			eventScheduleItems: [
				eventItem("e1", "Speech", "1 hr"),
				eventItem("e2", "Games", "2 hr"),
			],
		};
		const { result } = setup(form, 1, true);
		expect(result.current.validation.eventDuration.valid).toBe(true);
		expect(result.current.validation.eventConflicts.valid).toBe(true);
		expect(result.current.validation.isAllValid).toBe(true);
		expect(result.current.stepError).toBeUndefined();
	});

	it("surfaces an event duration error on the event details step", () => {
		const form: NewScheduleFormState = {
			...baseForm,
			scheduleType: "event",
			eventScheduleItems: [
				eventItem("e1", "Ceremony", "7 hr"),
				eventItem("e2", "Party", "6 hr"), // 780 > 720
			],
		};
		const { result } = setup(form, 1, true);
		expect(result.current.validation.eventDuration.valid).toBe(false);
		// Total exceeding the window also makes the sequential run exceed it,
		// so both event messages surface together.
		expect(result.current.stepError).toContain(
			result.current.validation.eventDuration.message,
		);
	});

	it("surfaces an unnamed-event-item error on the event details step", () => {
		const form: NewScheduleFormState = {
			...baseForm,
			scheduleType: "event",
			eventScheduleItems: [
				eventItem("e1", "Speech", "1 hr"),
				eventItem("e2", "", "30 min"),
			],
		};
		const { result } = setup(form, 1, true);
		expect(result.current.validation.eventItemsPresent.valid).toBe(false);
		expect(result.current.stepError).toBe(
			result.current.validation.eventItemsPresent.message,
		);
	});

	it("keeps event validation out of personal steps (step 1 stays clean for event data)", () => {
		// For personal schedules, event-only data must not drive a step-1 error.
		const form: NewScheduleFormState = {
			...baseForm,
			scheduleType: "personal",
			eventScheduleItems: [
				eventItem("e1", "Ceremony", "7 hr"),
				eventItem("e2", "Party", "6 hr"),
			],
		};
		const { result } = setup(form, 1, false);
		expect(result.current.stepError).toBeUndefined();
	});
});
