// Tests for ScheduleFormWindowtimeRuleValidator
import ScheduleFormWindowtimeRuleValidator from "../ScheduleFormWindowtimeRuleValidator";
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

  it("passes all individual validations for a valid schedule", () => {
    const validator = new ScheduleFormWindowtimeRuleValidator(baseForm);

    expect(validator.validateWindowMinDuration().valid).toBe(true);
    expect(validator.validateAppWindowTime().valid).toBe(true);
    expect(validator.validateMealWindowTime().valid).toBe(true);
    expect(validator.validateBreakFreqWindow().valid).toBe(true);
    expect(validator.validatePriorityTimeWindow().valid).toBe(true);
  });

  it("detects invalid window duration (zero-length window)", () => {
    const form = { ...baseForm, endTime: new Date("2026-07-07T08:00:00") }; // same as startTime
    const validator = new ScheduleFormWindowtimeRuleValidator(form);
    const result = validator.validateWindowMinDuration();
    expect(result.valid).toBe(false);
    expect(result.message).toContain("Invalid time window");
  });

  it("treats an end time before start time as an overnight window (wraps to 24h)", () => {
    // getTotalWindowMin adds 24h when diff is negative, so this is NOT an invalid window —
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

  it("passes break frequency validation when window has enough room", () => {
    const form = { ...baseForm, breakFrequency: "many-short" as const };
    const validator = new ScheduleFormWindowtimeRuleValidator(form);
    // many-short = 0.15 * 240 = 36 mins, fixed = 90+30=120, 120+36=156 < 240 => valid
    expect(validator.validateBreakFreqWindow().valid).toBe(true);
  });

  it("detects break frequency overflow and recommends alternative", () => {
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
});
