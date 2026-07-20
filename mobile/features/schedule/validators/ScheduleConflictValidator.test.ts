import ScheduleConflictValidator from "./ScheduleConflictValidator";
import type { NewScheduleFormState } from "@/type/NewScheduleTypes";

describe("ScheduleConflictValidator", () => {
  const baseForm: NewScheduleFormState = {
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
  };

  function appt(
    id: string,
    type: string,
    start: string,
    end: string,
    customLabel = "",
  ) {
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
    type: string,
    durationMinutes: number,
    placement: "flexible" | "fixed_time",
    fixedTime?: string,
  ) {
    return {
      id,
      type,
      durationMinutes,
      placement,
      fixedTime: fixedTime ? new Date(`2026-07-07T${fixedTime}:00`) : undefined,
    };
  }

  // ---------------------------------------------------------------------
  // Basic pass/fail behavior
  // ---------------------------------------------------------------------

  it("returns valid when there are no time blocks at all", () => {
    const validator = new ScheduleConflictValidator(baseForm);
    expect(validator.validateTimeConflicts().valid).toBe(true);
  });

  it("returns valid when there is only a single time block", () => {
    const form = {
      ...baseForm,
      appointments: [appt("a1", "work", "09:00", "10:00")],
    };
    const validator = new ScheduleConflictValidator(form as any);
    expect(validator.validateTimeConflicts().valid).toBe(true);
  });

  it("returns valid for two non-overlapping appointments", () => {
    const form = {
      ...baseForm,
      appointments: [
        appt("a1", "work", "09:00", "10:00"),
        appt("a2", "medical", "10:30", "11:00"),
      ],
    };
    const validator = new ScheduleConflictValidator(form as any);
    expect(validator.validateTimeConflicts().valid).toBe(true);
  });

  it("treats back-to-back appointments (end === next start) as non-overlapping", () => {
    const form = {
      ...baseForm,
      appointments: [
        appt("a1", "work", "09:00", "10:00"),
        appt("a2", "medical", "10:00", "11:00"),
      ],
    };
    const validator = new ScheduleConflictValidator(form as any);
    expect(validator.validateTimeConflicts().valid).toBe(true);
  });

  it("detects two overlapping appointments and names both in the message", () => {
    const form = {
      ...baseForm,
      appointments: [
        appt("a1", "work", "09:00", "10:30"),
        appt("a2", "medical", "10:00", "11:00"),
      ],
    };
    const validator = new ScheduleConflictValidator(form as any);
    const result = validator.validateTimeConflicts();
    expect(result.valid).toBe(false);
    expect(result.message).toContain('"work"');
    expect(result.message).toContain('"medical"');
  });

  // ---------------------------------------------------------------------
  // Sorting / ordering behavior
  // ---------------------------------------------------------------------

  it("detects conflicts regardless of the order appointments are given in", () => {
    // a2 starts earlier but is listed second; the validator must sort by
    // start time before comparing adjacent pairs.
    const form = {
      ...baseForm,
      appointments: [
        appt("a1", "work", "10:00", "11:00"),
        appt("a2", "medical", "09:30", "10:30"),
      ],
    };
    const validator = new ScheduleConflictValidator(form as any);
    const result = validator.validateTimeConflicts();
    expect(result.valid).toBe(false);
    // After sorting by start time, "medical" (09:30) precedes "work" (10:00).
    expect(result.message).toBe('"medical" conflicts with "work".');
  });

  it("detects an appointment fully containing another, non-adjacent appointment", () => {
    // A (09:00-12:00) contains both B (09:30-09:45) and C (10:00-10:15).
    // Because the input is sorted by start time first, A is compared
    // against its immediate neighbor B, which already overlaps -- so this
    // is caught even though A and C themselves are never compared directly.
    const form = {
      ...baseForm,
      appointments: [
        appt("a1", "work", "09:00", "12:00", "Big block"),
        appt("a2", "medical", "09:30", "09:45"),
        appt("a3", "custom", "10:00", "10:15", "Errand"),
      ],
    };
    const validator = new ScheduleConflictValidator(form as any);
    const result = validator.validateTimeConflicts();
    expect(result.valid).toBe(false);
    expect(result.message).toBe('"work" conflicts with "medical".');
  });

  // ---------------------------------------------------------------------
  // Labeling
  // ---------------------------------------------------------------------

  it("labels a custom appointment using customLabel when provided", () => {
    const form = {
      ...baseForm,
      appointments: [
        appt("a1", "custom", "09:00", "10:00", "Therapy"),
        appt("a2", "custom", "09:30", "10:30", "Gym"),
      ],
    };
    const validator = new ScheduleConflictValidator(form as any);
    const result = validator.validateTimeConflicts();
    expect(result.message).toBe('"Therapy" conflicts with "Gym".');
  });

  it("falls back to 'Custom appointment' when a custom appointment has no customLabel", () => {
    const form = {
      ...baseForm,
      appointments: [
        appt("a1", "custom", "09:00", "10:00", ""),
        appt("a2", "custom", "09:30", "10:30", ""),
      ],
    };
    const validator = new ScheduleConflictValidator(form as any);
    const result = validator.validateTimeConflicts();
    expect(result.message).toBe(
      '"Custom appointment" conflicts with "Custom appointment".',
    );
  });

  // ---------------------------------------------------------------------
  // Fixed-time meals
  // ---------------------------------------------------------------------

  it("includes fixed-time meals as blocks and detects conflicts against appointments", () => {
    const form = {
      ...baseForm,
      appointments: [appt("a1", "work", "12:00", "13:00")],
      meals: [meal("m1", "lunch", 45, "fixed_time", "12:30")],
    };
    const validator = new ScheduleConflictValidator(form as any);
    const result = validator.validateTimeConflicts();
    expect(result.valid).toBe(false);
    expect(result.message).toBe('"work" conflicts with "lunch".');
  });

  it("ignores flexible meals even when a fixedTime is (incorrectly) supplied", () => {
    const form = {
      ...baseForm,
      appointments: [appt("a1", "work", "12:00", "13:00")],
      meals: [meal("m1", "lunch", 45, "flexible", "12:30")],
    };
    const validator = new ScheduleConflictValidator(form as any);
    expect(validator.validateTimeConflicts().valid).toBe(true);
  });

  it("ignores fixed_time meals that have no fixedTime set", () => {
    const form = {
      ...baseForm,
      appointments: [appt("a1", "work", "12:00", "13:00")],
      meals: [meal("m1", "lunch", 45, "fixed_time", undefined)],
    };
    const validator = new ScheduleConflictValidator(form as any);
    expect(validator.validateTimeConflicts().valid).toBe(true);
  });

  it("detects two overlapping fixed-time meals", () => {
    const form = {
      ...baseForm,
      meals: [
        meal("m1", "breakfast", 30, "fixed_time", "08:00"),
        meal("m2", "brunch", 30, "fixed_time", "08:15"),
      ],
    };
    const validator = new ScheduleConflictValidator(form as any);
    const result = validator.validateTimeConflicts();
    expect(result.valid).toBe(false);
    expect(result.message).toBe('"breakfast" conflicts with "brunch".');
  });

  // ---------------------------------------------------------------------
  // Window-boundary check (validateTimeBlocksWithinWindow)
  // ---------------------------------------------------------------------

  it("treats a 9am-10am appointment as inside a full 24h window (00:00->00:00)", () => {
    const form = {
      ...baseForm,
      startTime: new Date("2026-07-07T00:00:00"),
      endTime: new Date("2026-07-07T00:00:00"), // equal -> full-day window
      appointments: [appt("a1", "work", "09:00", "10:00")],
    };
    const validator = new ScheduleConflictValidator(form as any);
    expect(validator.validateTimeBlocksWithinWindow().valid).toBe(true);
  });

  it("treats an 11pm appointment as inside a full 24h window", () => {
    const form = {
      ...baseForm,
      startTime: new Date("2026-07-07T00:00:00"),
      endTime: new Date("2026-07-07T00:00:00"),
      appointments: [appt("a1", "work", "23:00", "23:30")],
    };
    const validator = new ScheduleConflictValidator(form as any);
    expect(validator.validateTimeBlocksWithinWindow().valid).toBe(true);
  });

  // ---------------------------------------------------------------------
  // Known gap: no overnight/wraparound handling (unlike the window validator)
  // ---------------------------------------------------------------------

  it("[documents existing gap] does not adjust for overnight blocks the way the window validator does", () => {
    // ScheduleFormWindowtimeRuleValidator.getWindowMinutes adds 24h when a
    // block's end is before its start, treating it as spanning midnight.
    // This validator makes no such adjustment: an appointment entered as
    // 23:00 -> 01:00 (both Date objects on the SAME calendar day) simply
    // has end < start, i.e. a "negative duration" block, and is compared
    // as-is against other blocks.
    const form = {
      ...baseForm,
      appointments: [
        appt("a1", "work", "23:00", "01:00"), // end before start, same calendar day
        appt("a2", "medical", "00:30", "00:45"),
      ],
    };
    const validator = new ScheduleConflictValidator(form as any);
    const result = validator.validateTimeConflicts();
    // Sorted by start: a2 (00:30) comes before a1 (23:00). a2.end (00:45)
    // does not exceed a1.start (23:00), so no conflict is reported --
    // even though an overnight 23:00->01:00 appointment plainly overlaps
    // a 00:30-00:45 slot in real-world terms.
    expect(result.valid).toBe(true);
  });
});
