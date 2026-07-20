import ScheduleFormWindowtimeRuleValidator from "./ScheduleFormWindowtimeRuleValidator";
import type { NewScheduleFormState } from "@/type/NewScheduleTypes";

describe("ScheduleFormWindowtimeRuleValidator", () => {
	const baseForm: NewScheduleFormState = {
		scheduleType: "personal",
		startTime: new Date("2026-07-07T08:00:00"),
		endTime: new Date("2026-07-07T12:00:00"), // 4 hours = 240 minutes
		showStartPicker: false,
		showEndPicker: false,
		appointments: [
			{
				id: "a1",
				type: "work",
				customLabel: "Work",
				startTime: new Date("2026-07-07T09:00:00"),
				endTime: new Date("2026-07-07T10:30:00"), // 90 min
			},
		],
		meals: [
			{
				id: "m1",
				type: "breakfast",
				durationMinutes: 30,
				placement: "flexible",
			},
		],
		breakFrequency: "balanced",
		priorityFocusText: "",
		priorityDurationMinutes: null,
		eventType: null,
		eventOtherLabel: "",
		eventScheduleItems: [],
	};

	// ---------------------------------------------------------------------
	// Original core behavior
	// ---------------------------------------------------------------------

	it("passes all individual validations for a valid schedule", () => {
		const validator = new ScheduleFormWindowtimeRuleValidator(baseForm);

		expect(validator.validateWindowMinDuration().valid).toBe(true);
		expect(validator.validateAppWindowTime().valid).toBe(true);
		expect(validator.validateMealWindowTime().valid).toBe(true);
		expect(validator.validateBreakFreqWindow().valid).toBe(true);
		expect(validator.validatePriorityTimeWindow().valid).toBe(true);
	});

	it("treats equal start and end times as a full 24h window, NOT an invalid window", () => {
		// getWindowMinutes adds 24h whenever diff <= 0, so startTime === endTime
		// wraps to exactly 1440 minutes rather than 0. This is valid, matching
		// the source comment: "Equal times (12am -> 12am) ... mean the window
		// extends into the next day".
		const form = { ...baseForm, endTime: new Date(baseForm.startTime) };
		const validator = new ScheduleFormWindowtimeRuleValidator(form);
		expect(validator.getWindowMinutes()).toBe(24 * 60);
		expect(validator.validateWindowMinDuration().valid).toBe(true);
	});

	it("detects invalid window duration when the raw negative gap is a full day or more", () => {
		// A single day's wraparound (+24h) only rescues negative gaps down to
		// -24h exclusive. Once startTime is a full 24h (or more) ahead of
		// endTime, the adjusted diff is <= 0 again, which IS genuinely invalid.
		const form = {
			...baseForm,
			startTime: new Date("2026-07-09T08:00:00"), // 2 days after endTime
			endTime: new Date("2026-07-07T08:00:00"),
		};
		const validator = new ScheduleFormWindowtimeRuleValidator(form);
		const result = validator.validateWindowMinDuration();
		expect(result.valid).toBe(false);
		expect(result.message).toContain("Invalid time window");
	});

	it("treats an end time before start time as an overnight window (wraps to 24h)", () => {
		// getWindowMinutes adds 24h when diff is negative, so this is NOT an invalid window —
		// it's interpreted as spanning midnight.
		const form = {
			...baseForm,
			startTime: new Date("2026-07-07T22:00:00"),
			endTime: new Date("2026-07-07T02:00:00"),
		};
		const validator = new ScheduleFormWindowtimeRuleValidator(form);
		expect(validator.getWindowMinutes()).toBe(4 * 60); // 22:00 -> 02:00 = 4 hours
		expect(validator.validateWindowMinDuration().valid).toBe(true);
	});

	it("detects appointment exceeding window", () => {
		const form = {
			...baseForm,
			appointments: [
				{
					id: "a1",
					type: "work",
					customLabel: "Work",
					startTime: new Date("2026-07-07T08:00:00"),
					endTime: new Date("2026-07-07T13:00:00"),
				},
			],
		};
		const validator = new ScheduleFormWindowtimeRuleValidator(form as any);
		const result = validator.validateAppWindowTime();
		expect(result.valid).toBe(false);
		expect(result.message).toContain("appointment duration exceeds");
	});

	it("detects meals exceeding window", () => {
		const form = {
			...baseForm,
			meals: [
				{
					id: "m1",
					type: "breakfast",
					durationMinutes: 300,
					placement: "flexible",
				},
			],
		};
		const validator = new ScheduleFormWindowtimeRuleValidator(form as any);
		const result = validator.validateMealWindowTime();
		expect(result.valid).toBe(false);
		expect(result.message).toContain("meals duration exceeds");
	});

	it("detects priority time overflow", () => {
		const form = { ...baseForm, priorityDurationMinutes: 200 };
		const validator = new ScheduleFormWindowtimeRuleValidator(form);
		const result = validator.validatePriorityTimeWindow();
		// 240 total - (90 appt + 30 meal + balanced break 0.12*240=28.8) ≈ 91.2 remaining < 200
		expect(result.valid).toBe(false);
		expect(result.message).toContain("remaining time");
	});

	it("accepts few-long break frequency when the window has enough room", () => {
		const form = { ...baseForm, breakFrequency: "few-long" as const };
		// few-long = 0.15 * 240 = 36 mins, fixed = 90+30=120, 120+36=156 < 240 => valid
		const validator = new ScheduleFormWindowtimeRuleValidator(form);
		expect(validator.validateBreakFreqWindow().valid).toBe(true);
	});

	it("passes break frequency validation when window has enough room", () => {
		const form = { ...baseForm, breakFrequency: "many-short" as const };
		// many-short = 0.09 * 240 = 21.6 mins, fixed = 90+30=120, 120+21.6=141.6 < 240 => valid
		const validator = new ScheduleFormWindowtimeRuleValidator(form);
		expect(validator.validateBreakFreqWindow().valid).toBe(true);
	});

	it("detects break frequency overflow and recommends an alternative", () => {
		const form = {
			...baseForm,
			breakFrequency: "many-short" as const,
			startTime: new Date("2026-07-07T08:00:00"),
			endTime: new Date("2026-07-07T09:00:00"), // 60 min window, fixed events alone = 120 min
		};
		const validator = new ScheduleFormWindowtimeRuleValidator(form);
		const result = validator.validateBreakFreqWindow();
		expect(result.valid).toBe(false);
		expect(result.message).toMatch(/Use the ".+" break style instead/);
	});

	it('skips break validation entirely when breakFrequency is "none"', () => {
		const form = {
			...baseForm,
			breakFrequency: "none" as const,
			startTime: new Date("2026-07-07T08:00:00"),
			endTime: new Date("2026-07-07T09:00:00"),
		};
		const validator = new ScheduleFormWindowtimeRuleValidator(form);
		expect(validator.validateBreakFreqWindow().valid).toBe(true);
	});

	// ---------------------------------------------------------------------
	// Break-frequency recommendation logic
	//
	// Current percentages: few-long 0.15, balanced 0.12, many-short 0.09, none 0.
	// Checked in that order. Since the percentages strictly DECREASE in check
	// order, the "how much fixed time can I have and still fit" thresholds
	// strictly INCREASE (fixed < window * (1 - p)):
	//   few-long   < 0.85 * window
	//   balanced   < 0.88 * window
	//   many-short < 0.91 * window
	//   none       < 1.00 * window
	// This makes every style reachable as a recommendation except few-long
	// (see dedicated test below for why).
	//
	// All scenarios below use a clean 200-minute window (08:00 -> 11:20) and a
	// single appointment with no meals, so "fixed minutes" == appointment length.
	// ---------------------------------------------------------------------

	const windowStart = new Date("2026-07-07T08:00:00");
	const windowEnd = new Date("2026-07-07T11:20:00"); // 200 minutes

	function formWithFixedMinutes(
		fixedMinutes: number,
		breakFrequency: NewScheduleFormState["breakFrequency"],
	): NewScheduleFormState {
		const apptEnd = new Date(windowStart.getTime() + fixedMinutes * 60 * 1000);
		return {
			...baseForm,
			startTime: windowStart,
			endTime: windowEnd,
			appointments: [
				{
					id: "a1",
					type: "work",
					customLabel: "Work",
					startTime: windowStart,
					endTime: apptEnd,
				},
			],
			meals: [],
			breakFrequency,
		};
	}

	it("recommends balanced when few-long overflows but balanced still fits (170 <= fixed < 176)", () => {
		const form = formWithFixedMinutes(172, "few-long");
		const validator = new ScheduleFormWindowtimeRuleValidator(form);
		const result = validator.validateBreakFreqWindow();
		expect(result.valid).toBe(false);
		expect(result.message).toContain('Use the "balanced" break style instead');
	});

	it("recommends many-short when balanced overflows but many-short still fits (176 <= fixed < 182)", () => {
		const form = formWithFixedMinutes(178, "balanced");
		const validator = new ScheduleFormWindowtimeRuleValidator(form);
		const result = validator.validateBreakFreqWindow();
		expect(result.valid).toBe(false);
		expect(result.message).toContain(
			'Use the "many-short" break style instead',
		);
	});

	it("recommends none when even many-short can't fit (fixed >= 182)", () => {
		const form = formWithFixedMinutes(185, "many-short");
		const validator = new ScheduleFormWindowtimeRuleValidator(form);
		const result = validator.validateBreakFreqWindow();
		expect(result.valid).toBe(false);
		expect(result.message).toContain('Use the "none" break style instead');
	});

	it("never recommends few-long as the alternative, since it's the strictest style checked first", () => {
		// Whenever an overflow is detected for ANY selectable style (few-long,
		// balanced, or many-short — "none" never overflows since it's skipped
		// entirely), fixed minutes must already be >= the many-short threshold
		// (the loosest of the three), which is always >= the few-long threshold.
		// So few-long can never be the recommended fallback.
		const scenarios: Array<{
			fixed: number;
			style: "few-long" | "balanced" | "many-short";
		}> = [
			{ fixed: 172, style: "few-long" },
			{ fixed: 178, style: "balanced" },
			{ fixed: 185, style: "many-short" },
			{ fixed: 199, style: "many-short" },
		];

		for (const { fixed, style } of scenarios) {
			const form = formWithFixedMinutes(fixed, style);
			const validator = new ScheduleFormWindowtimeRuleValidator(form);
			const result = validator.validateBreakFreqWindow();
			expect(result.valid).toBe(false);
			expect(result.message).not.toContain('"few-long"');
		}
	});

	it("passes for each style when fixed minutes stay under that style's own threshold", () => {
		// few-long: threshold 170
		expect(
			new ScheduleFormWindowtimeRuleValidator(
				formWithFixedMinutes(160, "few-long"),
			).validateBreakFreqWindow().valid,
		).toBe(true);

		// balanced: threshold 176
		expect(
			new ScheduleFormWindowtimeRuleValidator(
				formWithFixedMinutes(170, "balanced"),
			).validateBreakFreqWindow().valid,
		).toBe(true);

		// many-short: threshold 182
		expect(
			new ScheduleFormWindowtimeRuleValidator(
				formWithFixedMinutes(180, "many-short"),
			).validateBreakFreqWindow().valid,
		).toBe(true);
	});

	// ---------------------------------------------------------------------
	// Known gap: `breakFrequency: null` silently bypasses validation.
	//
	// The type allows `BreakFrequency` to be `null`, but the code only special
	// -cases the string "none". With null, `getBreakPercentage()[null]` is
	// `undefined`, so `getBreakWindowMin()` returns NaN — and every NaN
	// comparison is false, so both validators below return `valid: true`
	// regardless of how overbooked the schedule actually is. These tests
	// document the CURRENT behavior; if this isn't intended, treating `null`
	// the same as `"none"` (or requiring a non-null value before validating)
	// would be the fix.
	// ---------------------------------------------------------------------

	it("[documents existing gap] validateBreakFreqWindow passes silently when breakFrequency is null, even with zero room left", () => {
		const form = formWithFixedMinutes(200, null); // fixed minutes == entire window
		const validator = new ScheduleFormWindowtimeRuleValidator(form);
		expect(validator.validateBreakFreqWindow().valid).toBe(true);
	});

	it("[documents existing gap] validatePriorityTimeWindow passes silently when breakFrequency is null, even with an oversized priority duration", () => {
		const form = {
			...formWithFixedMinutes(150, null),
			priorityDurationMinutes: 10_000, // absurdly large, should never fit
		};
		const validator = new ScheduleFormWindowtimeRuleValidator(form);
		expect(validator.validatePriorityTimeWindow().valid).toBe(true);
	});

	// ---------------------------------------------------------------------
	// Aggregation getters
	// ---------------------------------------------------------------------

	it("sums multiple appointments and multiple meals correctly", () => {
		const form: NewScheduleFormState = {
			...baseForm,
			startTime: new Date("2026-07-07T00:00:00"),
			endTime: new Date("2026-07-07T00:00:00"), // wraps to a full 24h window
			appointments: [
				{
					id: "a1",
					type: "work",
					customLabel: "Work",
					startTime: new Date("2026-07-07T08:00:00"),
					endTime: new Date("2026-07-07T09:00:00"), // 60 min
				},
				{
					id: "a2",
					type: "medical",
					customLabel: "Checkup",
					startTime: new Date("2026-07-07T10:00:00"),
					endTime: new Date("2026-07-07T10:45:00"), // 45 min
				},
			],
			meals: [
				{
					id: "m1",
					type: "breakfast",
					durationMinutes: 20,
					placement: "flexible",
				},
				{ id: "m2", type: "lunch", durationMinutes: 35, placement: "flexible" },
			],
		};

		const validator = new ScheduleFormWindowtimeRuleValidator(form);
		expect(validator.getAppointmentsTotalMinutes()).toBe(105); // 60 + 45
		expect(validator.getMealsTotalMinutes()).toBe(55); // 20 + 35
		expect(validator.getPersonalOverallMinutes()).toBe(160); // 105 + 55
	});

	it("counts an overnight appointment (end time before start time) as wrapping past midnight", () => {
		const form: NewScheduleFormState = {
			...baseForm,
			startTime: new Date("2026-07-07T00:00:00"),
			endTime: new Date("2026-07-07T00:00:00"), // full 24h window
			appointments: [
				{
					id: "a1",
					type: "work",
					customLabel: "Night shift",
					startTime: new Date("2026-07-07T23:00:00"),
					endTime: new Date("2026-07-07T01:00:00"), // wraps to 2h = 120 min
				},
			],
			meals: [],
		};

		const validator = new ScheduleFormWindowtimeRuleValidator(form);
		expect(validator.getAppointmentsTotalMinutes()).toBe(120);
	});
});
