/**
 * Comprehensive validation-output test suite for the Wizard Form's validator
 * (`useWizardValidation`).
 *
 * These tests exercise the **actual output** the validator produces for the
 * Wizard Form — the `validation` result object (ten `ValidatorResType` fields),
 * the `stepError` string mapped from those results, and the `fixedScheduleDuration`
 * summary — rather than poking at internal implementation details.
 *
 * Step → validator mapping (PERSONAL flow):
 *   step 1 → windowTime
 *   step 2 → appointments + conflicts + timeBlockRange
 *   step 3 → meals + conflicts + timeBlockRange
 *   step 4 → breaks
 *   step 5 → priorityTime
 *
 * Step → validator mapping (EVENT flow):
 *   step 3 → eventItemsPresent + eventDuration + eventConflicts
 *
 * All other steps return stepError = undefined.
 */

import { renderHook } from "@testing-library/react-native";

import type {
  Appointment,
  AppointmentType,
  BreakFrequency,
  EventScheduleItem,
  MealPlacement,
  MealType,
  NewScheduleFormState,
} from "@/type/NewScheduleTypes";

import { useWizardValidation } from "./useScheduleFormValidator";

// ─── Fixture builders ───────────────────────────────────────────────────────

/** A clean 12-hour personal-form (08:00–20:00 = 720 min) with no items. */
function personalBaseForm(
  overrides: Partial<NewScheduleFormState> = {},
): NewScheduleFormState {
  return {
    scheduleType: "personal",
    startTime: new Date("2026-07-07T08:00:00"),
    endTime: new Date("2026-07-07T20:00:00"),
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
    ...overrides,
  };
}

/** Same window but configured for the event flow (breaks/priority left null). */
function eventBaseForm(
  overrides: Partial<NewScheduleFormState> = {},
): NewScheduleFormState {
  return {
    scheduleType: "event",
    startTime: new Date("2026-07-07T08:00:00"),
    endTime: new Date("2026-07-07T20:00:00"),
    showStartPicker: false,
    showEndPicker: false,
    appointments: [],
    meals: [],
    breakFrequency: null,
    priorityFocusText: "",
    priorityDurationMinutes: null,
    eventType: "birthday",
    eventOtherLabel: "",
    eventScheduleItems: [],
    ...overrides,
  };
}

function appt(
  id: string,
  type: AppointmentType | "custom",
  start: string,
  end: string,
  customLabel = "",
): Appointment {
  return {
    id,
    type: type === "custom" ? "custom" : type,
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
): NewScheduleFormState["meals"][number] {
  return {
    id,
    type,
    durationMinutes,
    placement,
    fixedTime: fixedTime ? new Date(`2026-07-07T${fixedTime}:00`) : undefined,
  };
}

/** Flexible event item: no explicit time, only a (possibly null) duration. */
function flexEventItem(
  id: string,
  name: string,
  durationMin: number | null,
): EventScheduleItem {
  return { id, name, durationMinutes: durationMin, isFixedTime: false };
}

/** Fixed-time event item with an explicit start time. */
function fixedEventItem(
  id: string,
  name: string,
  fixedTime: string,
  durationMin: number | null = null,
): EventScheduleItem {
  return {
    id,
    name,
    durationMinutes: durationMin,
    isFixedTime: true,
    fixedTime: new Date(`2026-07-07T${fixedTime}:00`),
  };
}

// ─── renderHook wrapper ─────────────────────────────────────────────────────

function setup(
  form: NewScheduleFormState,
  step: number,
  isEvent = form.scheduleType === "event",
) {
  return renderHook(
    (props: { form: NewScheduleFormState; step: number; isEvent: boolean }) =>
      useWizardValidation(props),
    { initialProps: { form, step, isEvent } },
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("useWizardValidation — validator output", () => {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. Baseline & isAllValid aggregation
  // ──────────────────────────────────────────────────────────────────────────

  describe("isAllValid aggregation", () => {
    it("is true when every validator passes for a minimal personal form", () => {
      // A 12-hour window, balanced breaks, no appointments/meals/priority,
      // no event items — every validator should independently return valid.
      const { result } = setup(personalBaseForm(), 2);

      expect(result.current.validation.isAllValid).toBe(true);
      expect(result.current.stepError).toBeUndefined();
    });

    it("is false when exactly one validator fails", () => {
      // A single appointment that exactly fills the window leaves no room
      // for balanced breaks (0.12 × 720 = 86.4 min), so breaks validation fails.
      const form = personalBaseForm({
        appointments: [appt("a1", "work", "08:00", "20:00")], // 720 min
      });
      const { result } = setup(form, 2);

      expect(result.current.validation.breaks.valid).toBe(false);
      expect(result.current.validation.isAllValid).toBe(false);
    });

    it("is false when multiple validators fail simultaneously", () => {
      // Two 10-hour appointments in a 12-hour window: appointments exceeds
      // the window (1200 > 720) AND the two overlap, so at least two validators fail.
      const form = personalBaseForm({
        appointments: [
          appt("a1", "work", "08:00", "18:00"), // 600 min
          appt("a2", "medical", "10:00", "20:00"), // 600 min, overlaps a1
        ],
      });
      const { result } = setup(form, 2);

      expect(result.current.validation.appointments.valid).toBe(false);
      expect(result.current.validation.conflicts.valid).toBe(false);
      expect(result.current.validation.isAllValid).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. windowTime — validateWindowMinDuration
  // ──────────────────────────────────────────────────────────────────────────

  describe("windowTime (validateWindowMinDuration)", () => {
    it("is valid for a standard daytime window", () => {
      const { result } = setup(personalBaseForm(), 1);
      expect(result.current.validation.windowTime.valid).toBe(true);
      expect(result.current.validation.windowTime.message).toBeUndefined();
    });

    it("treats equal start and end times as a full 24h window", () => {
      // getWindowMinutes adds 24h when diff <= 0, so 00:00→00:00 = 1440 min.
      const form = personalBaseForm({
        startTime: new Date("2026-07-07T00:00:00"),
        endTime: new Date("2026-07-07T00:00:00"),
      });
      const { result } = setup(form, 1);
      expect(result.current.validation.windowTime.valid).toBe(true);
    });

    it("treats end-before-start as an overnight window (wraps past midnight)", () => {
      // 22:00 → 02:00 = 4 hours. diff is negative (-22h), +24h = 2h? No —
      // diff = 02:00 - 22:00 = -20h, +24h = 4h = 240 min.
      const form = personalBaseForm({
        startTime: new Date("2026-07-07T22:00:00"),
        endTime: new Date("2026-07-07T02:00:00"),
      });
      const { result } = setup(form, 1);
      expect(result.current.validation.windowTime.valid).toBe(true);
    });

    it("is invalid when startTime is more than 24h ahead of endTime", () => {
      // diff = endTime - startTime = (Jul 7 08:00) - (Jul 9 08:00) = -48h.
      // +24h → -24h → still <= 0 → window = -1440 → invalid.
      const form = personalBaseForm({
        startTime: new Date("2026-07-09T08:00:00"),
        endTime: new Date("2026-07-07T08:00:00"),
      });
      const { result } = setup(form, 1);
      expect(result.current.validation.windowTime.valid).toBe(false);
      expect(result.current.validation.windowTime.message).toBe(
        "Invalid time window input",
      );
    });

    it("surfaces its message on step 1 and only on step 1", () => {
      const form = personalBaseForm({
        startTime: new Date("2026-07-09T08:00:00"),
        endTime: new Date("2026-07-07T08:00:00"),
      });

      // Step 1: windowTime is the only validator surfaced.
      const step1 = setup(form, 1);
      expect(step1.result.current.stepError).toBe(
        step1.result.current.validation.windowTime.message,
      );

      // Step 2: appointments/conflicts/timeBlockRange are surfaced instead.
      // windowTime is NOT part of step 2's mapping.
      const step2 = setup(form, 2);
      expect(step2.result.current.stepError).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. appointments — validateAppWindowTime
  // ──────────────────────────────────────────────────────────────────────────

  describe("appointments (validateAppWindowTime)", () => {
    it("is valid when there are no appointments", () => {
      const { result } = setup(personalBaseForm(), 2);
      expect(result.current.validation.appointments.valid).toBe(true);
    });

    it("is valid when appointment total fits inside the window with meals", () => {
      // 240 min appointment + 30 min meal = 270 ≤ 720.
      const form = personalBaseForm({
        appointments: [appt("a1", "work", "08:00", "12:00")], // 240 min
        meals: [meal("m1", "lunch", 30, "flexible")],
      });
      const { result } = setup(form, 2);
      expect(result.current.validation.appointments.valid).toBe(true);
    });

    it("is valid at the exact boundary — appointment + meals equal the window", () => {
      // 720 min of appointments + 0 meals = exactly 720, which is NOT > 720.
      const form = personalBaseForm({
        appointments: [appt("a1", "work", "08:00", "20:00")], // 720 min
        meals: [],
      });
      const { result } = setup(form, 2);
      expect(result.current.validation.appointments.valid).toBe(true);
    });

    it("is invalid when appointment total exceeds the window", () => {
      // 750 min appointment (08:00 → 20:30) > 720 min window.
      const form = personalBaseForm({
        appointments: [appt("a1", "work", "08:00", "20:30")], // 750 min
      });
      const { result } = setup(form, 2);
      expect(result.current.validation.appointments.valid).toBe(false);
      expect(result.current.validation.appointments.message).toBe(
        "The total appointment duration exceeds the schedule time window.",
      );
    });

    it("becomes invalid when adding a meal pushes appointments past the window", () => {
      // 690 min appointment + 30 min meal = 720 ≤ 720 → valid for now.
      // Add another 30 min meal → 750 > 720 → appointments invalid.
      const validForm = personalBaseForm({
        appointments: [appt("a1", "work", "08:00", "19:30")], // 690 min
        meals: [meal("m1", "lunch", 30, "flexible")],
      });
      const { result: r1 } = setup(validForm, 2);
      expect(r1.current.validation.appointments.valid).toBe(true);

      const invalidForm = personalBaseForm({
        appointments: [appt("a1", "work", "08:00", "19:30")], // 690 min
        meals: [
          meal("m1", "lunch", 30, "flexible"),
          meal("m2", "dinner", 30, "flexible"),
        ], // +60 = 750 > 720
      });
      const { result: r2 } = setup(invalidForm, 2);
      expect(r2.current.validation.appointments.valid).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3b. meals — validateMealWindowTime
  // ──────────────────────────────────────────────────────────────────────────

  describe("meals (validateMealWindowTime)", () => {
    it("is valid when there are no meals", () => {
      const { result } = setup(personalBaseForm(), 3);
      expect(result.current.validation.meals.valid).toBe(true);
    });

    it("is valid when meal total fits inside the window", () => {
      const form = personalBaseForm({
        appointments: [appt("a1", "work", "08:00", "12:00")], // 240 min
        meals: [meal("m1", "lunch", 30, "flexible")], // 30 min → 270 ≤ 720
      });
      const { result } = setup(form, 3);
      expect(result.current.validation.meals.valid).toBe(true);
    });

    it("is valid at the exact boundary — meals + appointments equal the window", () => {
      const form = personalBaseForm({
        meals: [meal("m1", "lunch", 720, "flexible")], // 720 min meals + 0 appt
      });
      const { result } = setup(form, 3);
      expect(result.current.validation.meals.valid).toBe(true);
    });

    it("is invalid when meal total exceeds the window", () => {
      const form = personalBaseForm({
        meals: [meal("m1", "lunch", 750, "flexible")], // 750 > 720
      });
      const { result } = setup(form, 3);
      expect(result.current.validation.meals.valid).toBe(false);
      expect(result.current.validation.meals.message).toBe(
        "The total meals duration exceeds the schedule time window.",
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. conflicts — validateTimeConflicts
  // ──────────────────────────────────────────────────────────────────────────

  describe("conflicts (validateTimeConflicts)", () => {
    it("is valid when there are no time blocks at all", () => {
      const { result } = setup(personalBaseForm(), 2);
      expect(result.current.validation.conflicts.valid).toBe(true);
    });

    it("is valid for a single appointment (only one block, so no pairwise check)", () => {
      const form = personalBaseForm({
        appointments: [appt("a1", "work", "09:00", "10:00")],
      });
      const { result } = setup(form, 2);
      expect(result.current.validation.conflicts.valid).toBe(true);
    });

    it("is valid for two non-overlapping appointments", () => {
      const form = personalBaseForm({
        appointments: [
          appt("a1", "work", "09:00", "10:00"),
          appt("a2", "medical", "10:30", "11:00"),
        ],
      });
      const { result } = setup(form, 2);
      expect(result.current.validation.conflicts.valid).toBe(true);
    });

    it("treats back-to-back appointments (end === next start) as non-overlapping", () => {
      const form = personalBaseForm({
        appointments: [
          appt("a1", "work", "09:00", "10:00"),
          appt("a2", "medical", "10:00", "11:00"),
        ],
      });
      const { result } = setup(form, 2);
      expect(result.current.validation.conflicts.valid).toBe(true);
    });

    it("detects two overlapping appointments and names both labels in the message", () => {
      const form = personalBaseForm({
        appointments: [
          appt("a1", "work", "09:00", "10:30"),
          appt("a2", "medical", "10:00", "11:00"), // overlaps a1 10:00–10:30
        ],
      });
      const { result } = setup(form, 2);
      expect(result.current.validation.conflicts.valid).toBe(false);
      expect(result.current.validation.conflicts.message).toBe(
        '"work" conflicts with "medical".',
      );
    });

    it("detects conflicts regardless of the order appointments are listed", () => {
      // a2 (10:00–11:00) listed before a1 (09:00–10:30). After sorting by
      // start time, a1 (09:00) precedes a2 (10:00) and overlaps → conflict.
      const form = personalBaseForm({
        appointments: [
          appt("a1", "work", "10:00", "11:00"),
          appt("a2", "medical", "09:00", "10:30"),
        ],
      });
      const { result } = setup(form, 2);
      expect(result.current.validation.conflicts.valid).toBe(false);
      expect(result.current.validation.conflicts.message).toBe(
        '"medical" conflicts with "work".',
      );
    });

    it("includes fixed-time meals as blocks and detects their overlaps", () => {
      const form = personalBaseForm({
        meals: [
          meal("m1", "breakfast", 30, "fixed_time", "08:00"),
          meal("m2", "brunch", 30, "fixed_time", "08:15"), // overlaps m1
        ],
      });
      const { result } = setup(form, 2);
      expect(result.current.validation.conflicts.valid).toBe(false);
      expect(result.current.validation.conflicts.message).toBe(
        '"breakfast" conflicts with "brunch".',
      );
    });

    it("ignores flexible meals even when a fixedTime is (incorrectly) supplied", () => {
      const form = personalBaseForm({
        appointments: [appt("a1", "work", "12:00", "13:00")],
        meals: [meal("m1", "lunch", 45, "flexible", "12:30")], // flexible → not a block
      });
      const { result } = setup(form, 2);
      expect(result.current.validation.conflicts.valid).toBe(true);
    });

    it("labels a custom appointment using customLabel when provided", () => {
      const form = personalBaseForm({
        appointments: [
          appt("a1", "custom", "09:00", "10:00", "Therapy"),
          appt("a2", "custom", "09:30", "10:30", "Gym"),
        ],
      });
      const { result } = setup(form, 2);
      expect(result.current.validation.conflicts.message).toBe(
        '"Therapy" conflicts with "Gym".',
      );
    });

    it("falls back to 'Custom appointment' when a custom appointment has no label", () => {
      const form = personalBaseForm({
        appointments: [
          appt("a1", "custom", "09:00", "10:00", ""),
          appt("a2", "custom", "09:30", "10:30", ""),
        ],
      });
      const { result } = setup(form, 2);
      expect(result.current.validation.conflicts.message).toBe(
        '"Custom appointment" conflicts with "Custom appointment".',
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. timeBlockRange — validateTimeBlocksWithinWindow
  // ──────────────────────────────────────────────────────────────────────────

  describe("timeBlockRange (validateTimeBlocksWithinWindow)", () => {
    it("is valid when there are no time blocks", () => {
      const { result } = setup(personalBaseForm(), 2);
      expect(result.current.validation.timeBlockRange.valid).toBe(true);
    });

    it("is valid when an appointment sits fully inside the window", () => {
      const form = personalBaseForm({
        appointments: [appt("a1", "work", "09:00", "10:00")], // inside 08:00–20:00
      });
      const { result } = setup(form, 2);
      expect(result.current.validation.timeBlockRange.valid).toBe(true);
    });

    it("is invalid when an appointment starts before the window", () => {
      const form = personalBaseForm({
        appointments: [appt("a1", "work", "06:00", "07:00")], // before 08:00
      });
      const { result } = setup(form, 2);
      expect(result.current.validation.timeBlockRange.valid).toBe(false);
      expect(result.current.validation.timeBlockRange.message).toBe(
        '"work" is outside the schedule time window.',
      );
    });

    it("is invalid when a fixed-time meal starts before the window", () => {
      const form = personalBaseForm({
        meals: [meal("m1", "lunch", 45, "fixed_time", "07:00")], // before 08:00
      });
      const { result } = setup(form, 2);
      expect(result.current.validation.timeBlockRange.valid).toBe(false);
      expect(result.current.validation.timeBlockRange.message).toBe(
        '"lunch" is outside the schedule time window.',
      );
    });

    it("is invalid when a fixed-time meal ends after the window", () => {
      // 19:30 + 45 min = 20:15, which is after 20:00.
      const form = personalBaseForm({
        meals: [meal("m1", "dinner", 45, "fixed_time", "19:30")],
      });
      const { result } = setup(form, 2);
      expect(result.current.validation.timeBlockRange.valid).toBe(false);
    });

    it("is valid for an appointment that ends exactly at the window end", () => {
      // 08:00 → 20:00 on a 08:00–20:00 window: end = windowEnd, not > windowEnd.
      const form = personalBaseForm({
        appointments: [appt("a1", "work", "08:00", "20:00")],
      });
      const { result } = setup(form, 2);
      expect(result.current.validation.timeBlockRange.valid).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. breaks — validateBreakFreqWindow
  // ──────────────────────────────────────────────────────────────────────────

  describe("breaks (validateBreakFreqWindow)", () => {
    it("is valid for 'none' frequency — the entire window is available", () => {
      // With "none", getBreakWindowMin is never called; the validator short-circuits.
      const form = personalBaseForm({ breakFrequency: "none" });
      const { result } = setup(form, 4);
      expect(result.current.validation.breaks.valid).toBe(true);
    });

    it("is valid when fixed events + breaks fit inside the window", () => {
      // 120 min appointment + 86.4 min breaks = 206.4 ≤ 720.
      const form = personalBaseForm({
        appointments: [appt("a1", "work", "08:00", "10:00")], // 120 min
      });
      const { result } = setup(form, 4);
      expect(result.current.validation.breaks.valid).toBe(true);
    });

    it("is valid at the exact boundary — fixed events + breaks equal the window", () => {
      // Window = 200 min, few-long (0.15) → 30 min breaks.
      // 170 min appointment + 30 min breaks = 200 = window → valid (strict >).
      const form = personalBaseForm({
        startTime: new Date("2026-07-07T08:00:00"),
        endTime: new Date("2026-07-07T11:20:00"), // 200 min
        appointments: [appt("a1", "work", "08:00", "10:50")], // 170 min
        breakFrequency: "few-long",
      });
      const { result } = setup(form, 4);
      expect(result.current.validation.breaks.valid).toBe(true);
    });

    it("is invalid when fixed events + breaks exceed the window", () => {
      // 660 min appointment + 86.4 min breaks = 746.4 > 720.
      const form = personalBaseForm({
        appointments: [appt("a1", "work", "08:00", "19:00")], // 660 min
      });
      const { result } = setup(form, 4);
      expect(result.current.validation.breaks.valid).toBe(false);
      expect(result.current.validation.breaks.message).toContain(
        "There isn't enough free time",
      );
    });

    it("recommends an alternative break style in the error message", () => {
      // 172 min appointment in a 200-min window:
      // few-long (0.15) → 30 min breaks → 172 + 30 = 202 > 200 → overflow.
      // Recommendation walks up the list to "none".
      const form = personalBaseForm({
        startTime: new Date("2026-07-07T08:00:00"),
        endTime: new Date("2026-07-07T11:20:00"), // 200 min
        appointments: [appt("a1", "work", "08:00", "10:52")], // 172 min
        breakFrequency: "few-long",
      });
      const { result } = setup(form, 4);
      expect(result.current.validation.breaks.valid).toBe(false);
      expect(result.current.validation.breaks.message).toMatch(
        /Use the "\w[\w-]*" break style instead/,
      );
    });

    it("is valid when breakFrequency is none, even with no room left for breaks", () => {
      // "none" → 0% breaks, so the "none" bypass returns valid before the
      // overflow calculation even runs.
      const form = personalBaseForm({
        breakFrequency: "none",
        appointments: [appt("a1", "work", "08:00", "20:00")], // fills entire window
      });
      const { result } = setup(form, 4);
      expect(result.current.validation.breaks.valid).toBe(true);
    });

    it("[documents gap] returns valid when breakFrequency is null, even with no room left", () => {
      // null → getBreakPercentage()[null] = undefined → getBreakWindowMin = NaN →
      // NaN comparison is always false, so the overflow check never triggers.
      const form = personalBaseForm({
        breakFrequency: null,
        appointments: [appt("a1", "work", "08:00", "20:00")], // fills entire window
      });
      const { result } = setup(form, 4);
      expect(result.current.validation.breaks.valid).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. priorityTime — validatePriorityTimeWindow
  // ──────────────────────────────────────────────────────────────────────────

  describe("priorityTime (validatePriorityTimeWindow)", () => {
    it("is valid when priorityDurationMinutes is null", () => {
      const { result } = setup(personalBaseForm(), 5);
      expect(result.current.validation.priorityTime.valid).toBe(true);
    });

    it("is valid when priorityDurationMinutes is 0", () => {
      const form = personalBaseForm({ priorityDurationMinutes: 0 });
      const { result } = setup(form, 5);
      expect(result.current.validation.priorityTime.valid).toBe(true);
    });

    it("is valid when the priority duration fits in the remaining window", () => {
      // 720 - 0 (appt) - 0 (meals) - 86.4 (balanced breaks) = 633.6 remaining.
      const form = personalBaseForm({ priorityDurationMinutes: 633 });
      const { result } = setup(form, 5);
      expect(result.current.validation.priorityTime.valid).toBe(true);
    });

    it("is valid at the exact boundary — priority exactly equals remaining time", () => {
      // remaining = 633.6; priority = 633 is the largest integer ≤ 633.6.
      const form = personalBaseForm({ priorityDurationMinutes: 633 });
      const { result } = setup(form, 5);
      expect(result.current.validation.priorityTime.valid).toBe(true);
    });

    it("is invalid when the priority duration exceeds the remaining window", () => {
      // remaining = 633.6; 634 > 633.6 → invalid.
      const form = personalBaseForm({ priorityDurationMinutes: 634 });
      const { result } = setup(form, 5);
      expect(result.current.validation.priorityTime.valid).toBe(false);
      expect(result.current.validation.priorityTime.message).toContain("remaining time");
    });

    it("[documents gap] returns valid when breakFrequency is null, even with an absurd priority duration", () => {
      // null breakFrequency → getBreakWindowMin = NaN → remaining = NaN →
      // priority > NaN is always false → valid.
      const form = personalBaseForm({
        breakFrequency: null,
        priorityDurationMinutes: 10_000,
      });
      const { result } = setup(form, 5);
      expect(result.current.validation.priorityTime.valid).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Cross-field validation
  // ──────────────────────────────────────────────────────────────────────────

  describe("cross-field validation", () => {
    it("reduces priorityTime remaining when appointments are added", () => {
      // Without appointments: remaining = 720 - 0 - 0 - 86.4 = 633.6 → 633 valid.
      const noAppt = personalBaseForm({ priorityDurationMinutes: 633 });
      const r1 = setup(noAppt, 5);
      expect(r1.result.current.validation.priorityTime.valid).toBe(true);

      // With 120-min appointment: remaining = 720 - 120 - 0 - 86.4 = 513.6 → 514 invalid.
      const withAppt = personalBaseForm({
        appointments: [appt("a1", "work", "08:00", "10:00")],
        priorityDurationMinutes: 633, // now exceeds 513.6
      });
      const r2 = setup(withAppt, 5);
      expect(r2.result.current.validation.priorityTime.valid).toBe(false);
    });

    it("reduces priorityTime remaining when meals are added", () => {
      // Without meals: remaining = 633.6 → 633 valid.
      const noMeal = personalBaseForm({ priorityDurationMinutes: 633 });
      expect(setup(noMeal, 5).result.current.validation.priorityTime.valid).toBe(true);

      // With 60-min meal: remaining = 720 - 0 - 60 - 86.4 = 573.6 → 633 invalid.
      const withMeal = personalBaseForm({
        meals: [meal("m1", "lunch", 60, "flexible")],
        priorityDurationMinutes: 633,
      });
      expect(setup(withMeal, 5).result.current.validation.priorityTime.valid).toBe(false);
    });

    it("gives more remaining time when breaks are 'none' vs 'balanced'", () => {
      // With "none": remaining = 720 - 0 - 0 - 0 = 720 → 720 valid.
      const noBreak = personalBaseForm({
        breakFrequency: "none",
        priorityDurationMinutes: 720,
      });
      expect(setup(noBreak, 5).result.current.validation.priorityTime.valid).toBe(true);

      // With "balanced": remaining = 720 - 0 - 0 - 86.4 = 633.6 → 720 invalid.
      const balancedBreak = personalBaseForm({
        breakFrequency: "balanced",
        priorityDurationMinutes: 720,
      });
      expect(setup(balancedBreak, 5).result.current.validation.priorityTime.valid).toBe(
        false,
      );
    });

    it("breaks overflow is triggered by the combination of appointments + meals + break percentage", () => {
      // 120 min appointment + 60 min meal = 180 fixed.
      // balanced break = 0.12 * 720 = 86.4. Total = 266.4 ≤ 720 → valid.
      const fine = personalBaseForm({
        appointments: [appt("a1", "work", "08:00", "10:00")],
        meals: [meal("m1", "lunch", 60, "flexible")],
      });
      expect(setup(fine, 4).result.current.validation.breaks.valid).toBe(true);

      // Now fill 660 min with appointments: 660 + 0 + 86.4 = 746.4 > 720 → invalid.
      const tooFull = personalBaseForm({
        appointments: [appt("a1", "work", "08:00", "19:00")], // 660 min
        meals: [meal("m1", "lunch", 60, "flexible")], // 660 + 60 = 720 + 86.4 > 720
      });
      expect(setup(tooFull, 4).result.current.validation.breaks.valid).toBe(false);
    });

    it("appointments and meals share the same window budget — overflowing either triggers its own validator", () => {
      // 400-min appointment + 400-min meals = 800 > 720.
      // Both appointments (> window) and meals (> window) should fail, but
      // conflicts and timeBlockRange should still pass (no overlaps, blocks
      // are inside the window if timed right — they're not, so timeBlockRange
      // will also fail). This test focuses on the two duration validators.
      const form = personalBaseForm({
        appointments: [appt("a1", "work", "08:00", "14:40")], // 400 min
        meals: [meal("m1", "lunch", 400, "flexible")], // 400 min
      });
      const { result } = setup(form, 2);

      expect(result.current.validation.appointments.valid).toBe(false);
      expect(result.current.validation.meals.valid).toBe(false);
      // isAllValid must be false when multiple validators fail.
      expect(result.current.validation.isAllValid).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 9. fixedScheduleDuration
  // ──────────────────────────────────────────────────────────────────────────

  describe("fixedScheduleDuration", () => {
    it("is zero for an empty form", () => {
      const { result } = setup(personalBaseForm(), 2);
      expect(result.current.fixedScheduleDuration).toEqual({
        appMinutes: 0,
        mealMinutes: 0,
        overAllMinutes: 0,
      });
    });

    it("sums appointment and meal minutes correctly", () => {
      // 60 + 45 = 105 app; 30 + 35 = 65 meals; 170 overall.
      const form = personalBaseForm({
        appointments: [
          appt("a1", "work", "09:00", "10:00"), // 60
          appt("a2", "medical", "10:30", "11:15"), // 45
        ],
        meals: [
          meal("m1", "breakfast / morning outine", 30, "flexible"),
          meal("m2", "lunch", 35, "flexible"),
        ],
      });
      const { result } = setup(form, 2);
      expect(result.current.fixedScheduleDuration).toEqual({
        appMinutes: 105,
        mealMinutes: 65,
        overAllMinutes: 170,
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 10. stepError — PERSONAL flow step mapping
  // ──────────────────────────────────────────────────────────────────────────

  describe("stepError — personal flow", () => {
    it("returns undefined on step 0 (no error mapping for the schedule-type step)", () => {
      const form = personalBaseForm({
        appointments: [
          appt("a1", "work", "08:00", "18:00"),
          appt("a2", "medical", "09:00", "19:00"), // overlapping
        ],
      });
      const { result } = setup(form, 0);
      expect(result.current.validation.isAllValid).toBe(false);
      expect(result.current.stepError).toBeUndefined();
    });

    it("surfaces only windowTime on step 1, ignoring other failing validators", () => {
      // Window is fine (step 1), but appointments conflict — that error is
      // NOT surfaced at step 1; it's surfaced at step 2.
      const form = personalBaseForm({
        appointments: [
          appt("a1", "work", "09:00", "10:30"),
          appt("a2", "medical", "10:00", "11:00"), // conflicts
        ],
      });
      const { result } = setup(form, 1);
      expect(result.current.validation.conflicts.valid).toBe(false);
      expect(result.current.stepError).toBeUndefined();
    });

    it("surfaces appointments errors on step 2", () => {
      // Appointment ends at 20:30 — past the 20:00 window end — so both
      // appointments (750 > 720) and timeBlockRange fail; step 2 joins both.
      const form = personalBaseForm({
        appointments: [appt("a1", "work", "08:00", "20:30")], // 750 > 720
      });
      const { result } = setup(form, 2);
      expect(result.current.validation.appointments.valid).toBe(false);
      expect(result.current.validation.timeBlockRange.valid).toBe(false);
      expect(result.current.stepError).toContain(
        result.current.validation.appointments.message,
      );
    });

    it("surfaces conflicts errors on step 2", () => {
      const form = personalBaseForm({
        appointments: [
          appt("a1", "work", "09:00", "10:30"),
          appt("a2", "medical", "10:00", "11:00"),
        ],
      });
      const { result } = setup(form, 2);
      expect(result.current.stepError).toBe(result.current.validation.conflicts.message);
    });

    it("surfaces timeBlockRange errors on step 2", () => {
      const form = personalBaseForm({
        appointments: [appt("a1", "work", "06:00", "07:00")], // before window
      });
      const { result } = setup(form, 2);
      expect(result.current.stepError).toBe(
        result.current.validation.timeBlockRange.message,
      );
    });

    it("joins multiple step-2 failures with a newline in appointments→conflicts→timeBlockRange order", () => {
      // Two 600-min appointments: total = 1200 + 0 meals = 1200 > 720 → appointments fail.
      // a1 (08:00–18:00) and a2 (09:00–19:00) overlap → conflicts fail.
      // a1 starts inside the window, so timeBlockRange passes.
      const form = personalBaseForm({
        appointments: [
          appt("a1", "work", "08:00", "18:00"), // 600 min
          appt("a2", "medical", "09:00", "19:00"), // 600 min, overlaps
        ],
      });
      const { result } = setup(form, 2);
      const { appointments, conflicts, timeBlockRange } = result.current.validation;

      expect(appointments.valid).toBe(false);
      expect(conflicts.valid).toBe(false);
      expect(timeBlockRange.valid).toBe(true);

      // Only the failing validators are joined, in declaration order.
      expect(result.current.stepError).toBe(
        [appointments.message, conflicts.message].join("\n"),
      );
    });

    it("surfaces meals errors on step 3", () => {
      const form = personalBaseForm({
        meals: [meal("m1", "lunch", 750, "flexible")], // 750 > 720
      });
      const { result } = setup(form, 3);
      expect(result.current.stepError).toBe(result.current.validation.meals.message);
    });

    it("surfaces conflicts and timeBlockRange errors on step 3 as well", () => {
      // Fixed-time meal outside the window AND conflicting with an appointment.
      const form = personalBaseForm({
        appointments: [appt("a1", "work", "08:00", "09:00")],
        meals: [meal("m1", "lunch", 45, "fixed_time", "06:00")], // before window
      });
      const { result } = setup(form, 3);

      const { meals, conflicts, timeBlockRange } = result.current.validation;
      // Meals are 45 min, well within window → meals valid.
      expect(meals.valid).toBe(true);

      // The fixed meal at 06:00 is before the appointment at 08:00, and both
      // are before the window start. After normalizeMinute, 06:00 → 360+1440=1800
      // and 08:00 → 480+1440=1920. 1800 < 1920, 1800+45*60/1000... actually the
      // appointment 08:00-09:00 and meal 06:00-06:45 — after normalization both
      // shift +1440. Appointment: 1920–2040. Meal: 1800–1830. No overlap.
      // But timeBlockRange should still fail because both are before windowStart
      // (08:00 = 480). Wait — normalizeMinute shifts 360 → 1800 and 480 → 1920,
      // and windowEnd = 480 + 720 = 1200. 1800 > 1200 → outside! And 1920 > 1200.
      // Actually the appointment 08:00→09:00 has getMinutesOfDay = 480 and 540,
      // normalizeMinute(480, 480) = 480 (not < 480), normalizeMinute(540, 480) = 540.
      // start=480 >= windowStart=480, end=540 <= windowEnd=1200 → inside.
      // The meal: getMinutesOfDay("06:00") = 360, normalizeMinute(360, 480) = 1800.
      // start=1800 < windowStart=480? No. end=1800+45=1845 > windowEnd=1200? Yes → outside.
      expect(result.current.stepError).toBe(
        [timeBlockRange.message].filter(Boolean).join("\n"),
      );
    });

    it("surfaces breaks errors on step 4", () => {
      const form = personalBaseForm({
        appointments: [appt("a1", "work", "08:00", "20:00")], // fills window, no room for breaks
        breakFrequency: "balanced",
      });
      const { result } = setup(form, 4);
      expect(result.current.stepError).toBe(result.current.validation.breaks.message);
    });

    it("returns undefined on step 4 when breaks are valid even if other validators fail", () => {
      // Conflicting appointments make isAllValid false, but step 4 only
      // surfaces breaks errors — and breaks pass here.
      const form = personalBaseForm({
        appointments: [
          appt("a1", "work", "09:00", "10:30"),
          appt("a2", "medical", "10:00", "11:00"),
        ],
      });
      const { result } = setup(form, 4);
      expect(result.current.validation.conflicts.valid).toBe(false);
      expect(result.current.stepError).toBeUndefined();
    });

    it("surfaces priorityTime errors on step 5", () => {
      const form = personalBaseForm({ priorityDurationMinutes: 1000 }); // > 633.6 remaining
      const { result } = setup(form, 5);
      expect(result.current.stepError).toBe(
        result.current.validation.priorityTime.message,
      );
    });

    it("returns undefined on step 5 when priorityTime is valid even if other validators fail", () => {
      // Conflicting appointments make isAllValid false, but step 5 only
      // surfaces priorityTime errors — and priorityDurationMinutes is null.
      const form = personalBaseForm({
        appointments: [
          appt("a1", "work", "09:00", "10:30"),
          appt("a2", "medical", "10:00", "11:00"),
        ],
      });
      const { result } = setup(form, 5);
      expect(result.current.validation.conflicts.valid).toBe(false);
      expect(result.current.stepError).toBeUndefined();
    });

    it("returns undefined for steps beyond 5 (no error mapping defined)", () => {
      const form = personalBaseForm({
        appointments: [
          appt("a1", "work", "08:00", "18:00"),
          appt("a2", "medical", "09:00", "19:00"),
        ],
      });
      const { result } = setup(form, 6);
      expect(result.current.validation.isAllValid).toBe(false);
      expect(result.current.stepError).toBeUndefined();
    });

    it("returns undefined when isAllValid is true regardless of step", () => {
      const form = personalBaseForm();
      const { result } = setup(form, 1);
      expect(result.current.validation.isAllValid).toBe(true);
      expect(result.current.stepError).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 11. stepError — EVENT flow
  // ──────────────────────────────────────────────────────────────────────────

  describe("stepError — event flow", () => {
    it("surfaces eventItemsPresent error on step 3 when an item is unnamed", () => {
      const form = eventBaseForm({
        eventScheduleItems: [
          flexEventItem("e1", "Ceremony", 60),
          flexEventItem("e2", "", 30), // unnamed
        ],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventItemsPresent.valid).toBe(false);
      expect(result.current.stepError).toBe(
        result.current.validation.eventItemsPresent.message,
      );
    });

    it("surfaces eventDuration error on step 3 when total exceeds the window", () => {
      // 420 + 420 = 840 > 720.
      const form = eventBaseForm({
        eventScheduleItems: [
          flexEventItem("e1", "Ceremony", 420),
          flexEventItem("e2", "Party", 420),
        ],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventDuration.valid).toBe(false);
      expect(result.current.stepError).toBe(
        result.current.validation.eventDuration.message,
      );
    });

    it("surfaces eventConflicts error on step 3 when a fixed item is outside the window", () => {
      // Window: 08:00–20:00 (720 min). Fixed item at 21:00 is outside.
      const form = eventBaseForm({
        eventScheduleItems: [
          fixedEventItem("e1", "Toast", "21:00", 30), // after window end
        ],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventConflicts.valid).toBe(false);
      expect(result.current.stepError).toContain("outside the schedule time window");
    });

    it("surfaces eventConflicts error on step 3 when fixed items overlap", () => {
      const form = eventBaseForm({
        eventScheduleItems: [
          fixedEventItem("e1", "Ceremony", "18:00", 90), // 18:00–19:30
          fixedEventItem("e2", "Dinner", "19:00", 60), // 19:00–20:00, overlaps
        ],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventConflicts.valid).toBe(false);
      expect(result.current.stepError).toContain("conflicts with");
    });

    it("joins multiple event errors with a newline in eventItemsPresent→eventDuration→eventConflicts order", () => {
      // Unnamed item (e1) + total exceeds window + fixed item outside window.
      const form = eventBaseForm({
        eventScheduleItems: [
          flexEventItem("e1", "", 60), // unnamed → eventItemsPresent fails
          flexEventItem("e2", "Dance", 700), // total = 760 > 720 → eventDuration fails
          fixedEventItem("e3", "Fireworks", "21:00", 30), // outside window → eventConflicts fails
        ],
      });
      const { result } = setup(form, 3, true);
      const { eventItemsPresent, eventDuration, eventConflicts } =
        result.current.validation;

      expect(eventItemsPresent.valid).toBe(false);
      expect(eventDuration.valid).toBe(false);
      expect(eventConflicts.valid).toBe(false);

      expect(result.current.stepError).toBe(
        [eventItemsPresent.message, eventDuration.message, eventConflicts.message].join(
          "\n",
        ),
      );
    });

    it("returns undefined stepError at non-step-3 steps even when event validators fail", () => {
      const form = eventBaseForm({
        eventScheduleItems: [
          flexEventItem("e1", "", 60), // unnamed → eventItemsPresent invalid
        ],
      });

      for (const step of [0, 1, 2]) {
        const { result } = setup(form, step, true);
        expect(result.current.validation.eventItemsPresent.valid).toBe(false);
        expect(result.current.stepError).toBeUndefined();
      }
    });

    it("passes event validation for a valid event schedule with named items that fit", () => {
      const form = eventBaseForm({
        eventScheduleItems: [
          flexEventItem("e1", "Ceremony", 120),
          flexEventItem("e2", "Dinner", 180), // total 300 ≤ 720
        ],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.isAllValid).toBe(true);
      expect(result.current.stepError).toBeUndefined();
    });

    it("returns undefined stepError at step 3 when all event validators pass", () => {
      const form = eventBaseForm({
        eventScheduleItems: [
          fixedEventItem("e1", "Toast", "09:00", 15), // inside window
          flexEventItem("e2", "Mingling", 60),
        ],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.isAllValid).toBe(true);
      expect(result.current.stepError).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 12. Event validators exposed via the validation object
  // ──────────────────────────────────────────────────────────────────────────

  describe("eventItemsPresent", () => {
    it("is valid for personal schedules (bypassed)", () => {
      const form = personalBaseForm({
        eventScheduleItems: [flexEventItem("e1", "", 60)], // unnamed, but personal
      });
      const { result } = setup(form, 1, false);
      expect(result.current.validation.eventItemsPresent.valid).toBe(true);
    });

    it("is valid when there are no event items", () => {
      const { result } = setup(eventBaseForm(), 3, true);
      expect(result.current.validation.eventItemsPresent.valid).toBe(true);
    });

    it("is valid when every event item has a non-blank name", () => {
      const form = eventBaseForm({
        eventScheduleItems: [
          flexEventItem("e1", "Speech", 60),
          fixedEventItem("e2", "Dinner", "12:00", 45),
        ],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventItemsPresent.valid).toBe(true);
    });

    it("is invalid when any event item has a blank or whitespace-only name", () => {
      const form = eventBaseForm({
        eventScheduleItems: [
          flexEventItem("e1", "Speech", 60),
          flexEventItem("e2", "   ", 30), // whitespace only
        ],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventItemsPresent.valid).toBe(false);
      expect(result.current.validation.eventItemsPresent.message).toBe(
        "Every event segment must have a name.",
      );
    });
  });

  describe("eventDuration (validateEventDurationWindow)", () => {
    it("is valid for personal schedules (bypassed)", () => {
      const form = personalBaseForm({
        eventScheduleItems: [
          flexEventItem("e1", "Ceremony", 10000), // would overflow if not bypassed
        ],
      });
      const { result } = setup(form, 1, false);
      expect(result.current.validation.eventDuration.valid).toBe(true);
    });

    it("is valid when total duration fits within the event window", () => {
      const form = eventBaseForm({
        eventScheduleItems: [
          flexEventItem("e1", "Speech", 60),
          flexEventItem("e2", "Games", 120), // 180 ≤ 720
        ],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventDuration.valid).toBe(true);
    });

    it("is valid at the boundary — total duration exactly equals the window", () => {
      // Window is 720 min (08:00–20:00). Total = 720 → not > 720 → valid.
      const form = eventBaseForm({
        eventScheduleItems: [flexEventItem("e1", "Marathon", 720)],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventDuration.valid).toBe(true);
    });

    it("is invalid when total duration exceeds the window", () => {
      // 420 + 360 = 780 > 720.
      const form = eventBaseForm({
        eventScheduleItems: [
          flexEventItem("e1", "Ceremony", 420), // 7 hr
          flexEventItem("e2", "Party", 360), // 6 hr
        ],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventDuration.valid).toBe(false);
      expect(result.current.validation.eventDuration.message).toContain(
        "exceeds the schedule time window",
      );
      // The message includes both the actual total and the window size.
      expect(result.current.validation.eventDuration.message).toContain("780 min");
      expect(result.current.validation.eventDuration.message).toContain("720 min");
    });

    it("ignores null-duration items when checking the window", () => {
      // 60 min is well within 720; null items don't contribute.
      const form = eventBaseForm({
        eventScheduleItems: [
          flexEventItem("e1", "Intro", null),
          flexEventItem("e2", "Main", 60),
        ],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventDuration.valid).toBe(true);
    });
  });

  describe("eventConflicts (validateEventConflicts)", () => {
    it("is valid for personal schedules (bypassed)", () => {
      const form = personalBaseForm({
        eventScheduleItems: [
          fixedEventItem("e1", "Ceremony", "21:00", 60), // outside window, but bypassed
        ],
      });
      const { result } = setup(form, 1, false);
      expect(result.current.validation.eventConflicts.valid).toBe(true);
    });

    it("is valid when there are no fixed-time items", () => {
      const form = eventBaseForm({
        eventScheduleItems: [flexEventItem("e1", "Speech", 60)],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventConflicts.valid).toBe(true);
    });

    it("is valid when a fixed item sits fully inside the event window", () => {
      // Window 08:00–20:00. Fixed item 09:00–09:30 is inside.
      const form = eventBaseForm({
        eventScheduleItems: [fixedEventItem("e1", "Toast", "09:00", 30)],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventConflicts.valid).toBe(true);
    });

    it("is valid when a fixed item starts exactly at the window start", () => {
      const form = eventBaseForm({
        eventScheduleItems: [fixedEventItem("e1", "Doors", "08:00", 10)],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventConflicts.valid).toBe(true);
    });

    it("is valid when a fixed item ends exactly at the window end", () => {
      // 19:30 + 30 min = 20:00 = windowEnd. Not > windowEnd → valid.
      const form = eventBaseForm({
        eventScheduleItems: [fixedEventItem("e1", "Closing", "19:30", 30)],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventConflicts.valid).toBe(true);
    });

    it("is invalid when a fixed item starts before the window", () => {
      const form = eventBaseForm({
        eventScheduleItems: [fixedEventItem("e1", "Setup", "07:00", 30)],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventConflicts.valid).toBe(false);
      expect(result.current.validation.eventConflicts.message).toBe(
        '"Setup" is outside the schedule time window.',
      );
    });

    it("is invalid when a fixed item ends after the window", () => {
      // 19:45 + 30 = 20:15 > 20:00.
      const form = eventBaseForm({
        eventScheduleItems: [fixedEventItem("e1", "Speech", "19:45", 30)],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventConflicts.valid).toBe(false);
      expect(result.current.validation.eventConflicts.message).toContain(
        "outside the schedule time window",
      );
    });

    it("is invalid when two fixed items overlap", () => {
      const form = eventBaseForm({
        eventScheduleItems: [
          fixedEventItem("e1", "Ceremony", "18:00", 90), // 18:00–19:30
          fixedEventItem("e2", "Dinner", "19:00", 60), // 19:00–20:00, overlaps
        ],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventConflicts.valid).toBe(false);
      expect(result.current.validation.eventConflicts.message).toBe(
        '"Ceremony" conflicts with "Dinner".',
      );
    });

    it("is invalid when two fixed items overlap regardless of entry order", () => {
      // e2 (19:00) listed before e1 (18:00). After sorting by start time,
      // e1 (18:00) comes first and overlaps e2 (19:00).
      const form = eventBaseForm({
        eventScheduleItems: [
          fixedEventItem("e2", "Dinner", "19:00", 60),
          fixedEventItem("e1", "Ceremony", "18:00", 90),
        ],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventConflicts.valid).toBe(false);
      expect(result.current.validation.eventConflicts.message).toBe(
        '"Ceremony" conflicts with "Dinner".',
      );
    });

    it("is valid when fixed items are back-to-back (end === next start)", () => {
      const form = eventBaseForm({
        eventScheduleItems: [
          fixedEventItem("e1", "Ceremony", "18:00", 60), // 18:00–19:00
          fixedEventItem("e2", "Dinner", "19:00", 60), // 19:00–20:00
        ],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventConflicts.valid).toBe(true);
    });

    it("is valid when fixed items are mixed with non-overlapping flexible items", () => {
      const form = eventBaseForm({
        eventScheduleItems: [
          fixedEventItem("e1", "Toast", "09:00", 15),
          flexEventItem("e2", "Mingling", 30),
          fixedEventItem("e3", "Dinner", "12:00", 45),
        ],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventConflicts.valid).toBe(true);
    });

    it("treats a full 24h window (00:00→00:00) as accepting any time-of-day fixed item", () => {
      // Regression: getWindowMinutes returns 1440 for equal times, so a
      // fixed item at 09:00 or 23:00 sits inside the 0–1440 range.
      const form = eventBaseForm({
        startTime: new Date("2026-07-07T00:00:00"),
        endTime: new Date("2026-07-07T00:00:00"), // full day
        eventScheduleItems: [fixedEventItem("e1", "Late block", "23:00", 30)],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventConflicts.valid).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 13. Event window parity — getWindowMinutes behavior in the validation object
  // ──────────────────────────────────────────────────────────────────────────

  describe("event duration window math", () => {
    it("treats equal start/end times as a full 24h (1440-min) event window", () => {
      // 7 hr ceremony (420 min) fits in 1440 min.
      const form = eventBaseForm({
        startTime: new Date("2026-07-07T00:00:00"),
        endTime: new Date("2026-07-07T00:00:00"),
        eventScheduleItems: [flexEventItem("e1", "Ceremony", 420)],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventDuration.valid).toBe(true);
    });

    it("treats an end-before-start as an overnight event window", () => {
      // 10pm → 2am = 4 hours = 240 min. A 180-min item fits.
      const form = eventBaseForm({
        startTime: new Date("2026-07-07T22:00:00"),
        endTime: new Date("2026-07-07T02:00:00"),
        eventScheduleItems: [flexEventItem("e1", "Headliner", 180)],
      });
      const { result } = setup(form, 3, true);
      expect(result.current.validation.eventDuration.valid).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 14. Memoization — stable references
  // ──────────────────────────────────────────────────────────────────────────

  describe("memoization", () => {
    it("keeps the same validator/conflictValidator/eventValidator instances across rerenders with the same form reference", () => {
      const { result, rerender } = setup(personalBaseForm(), 2);

      const v1 = result.current.validator;
      const c1 = result.current.conflictValidator;
      const e1 = result.current.eventValidator;

      rerender({ form: personalBaseForm(), step: 2, isEvent: false });

      // new form object → new validator instances (form changed by reference)
      expect(result.current.validator).not.toBe(v1);
      expect(result.current.conflictValidator).not.toBe(c1);
    });

    it("produces a stable validation object when the form reference is unchanged across rerenders", () => {
      const form = personalBaseForm();
      const { result, rerender } = setup(form, 2);

      const validation1 = result.current.validation;

      rerender({ form, step: 2, isEvent: false });

      expect(result.current.validation).toBe(validation1);
    });

    it("recomputes stepError when step changes but the form stays the same", () => {
      // Conflicts fail at step 2 (appointments step) but not at step 4 (breaks).
      const form = personalBaseForm({
        appointments: [
          appt("a1", "work", "09:00", "10:30"),
          appt("a2", "medical", "10:00", "11:00"),
        ],
      });

      const { result, rerender } = setup(form, 2);
      expect(result.current.stepError).toBe(result.current.validation.conflicts.message);

      rerender({ form, step: 4, isEvent: false });
      expect(result.current.stepError).toBeUndefined();
      expect(result.current.validation.conflicts.valid).toBe(false);
    });
  });
});
