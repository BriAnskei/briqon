import EventScheduleValidator from "../EventScheduleValidator";
import type {
  EventScheduleItem,
  NewScheduleFormState,
} from "@/type/NewScheduleTypes";

describe("EventScheduleValidator", () => {
  const baseForm: NewScheduleFormState = {
    scheduleType: "event",
    startTime: new Date("2026-07-07T08:00:00"),
    endTime: new Date("2026-07-07T20:00:00"), // 12h = 720 minutes
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
  };

  function withItems(
    eventScheduleItems: EventScheduleItem[],
    overrides: Partial<NewScheduleFormState> = {},
  ): NewScheduleFormState {
    return { ...baseForm, eventScheduleItems, ...overrides };
  }

  // Flexible item: no explicit time, only a (possibly null) duration.
  function flexItem(
    id: string,
    name: string,
    durationMinutes: number | null,
  ): EventScheduleItem {
    return { id, name, durationMinutes, isFixedTime: false };
  }

  // Fixed-time item: an explicit start time, plus a (possibly null) duration.
  function fixedItem(
    id: string,
    name: string,
    fixedTime: Date,
    durationMinutes: number | null = null,
  ): EventScheduleItem {
    return { id, name, durationMinutes, isFixedTime: true, fixedTime };
  }

  function atTime(hours: number, minutes = 0): Date {
    const d = new Date("2026-07-07T00:00:00");
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  // -------------------------------------------------------------------
  // getEventTotalMinutes
  // -------------------------------------------------------------------

  it("sums durationMinutes across items", () => {
    const validator = new EventScheduleValidator(
      withItems([
        flexItem("e1", "Speech", 60),
        flexItem("e2", "Games", 45),
        flexItem("e3", "Dinner", 90),
      ]),
    );
    expect(validator.getEventTotalMinutes()).toBe(60 + 45 + 90);
  });

  it("treats a null duration as 0 when summing", () => {
    const validator = new EventScheduleValidator(
      withItems([flexItem("e1", "Intro", null), flexItem("e2", "Games", 30)]),
    );
    expect(validator.getEventTotalMinutes()).toBe(30);
  });

  it("returns 0 when there are no items", () => {
    const validator = new EventScheduleValidator(baseForm);
    expect(validator.getEventTotalMinutes()).toBe(0);
  });

  // -------------------------------------------------------------------
  // validateEventDurationWindow
  // -------------------------------------------------------------------

  it("passes when no measurable durations are present", () => {
    const validator = new EventScheduleValidator(
      withItems([flexItem("e1", "Free play", null)]),
    );
    expect(validator.validateEventDurationWindow().valid).toBe(true);
  });

  it("passes when total duration fits inside the window", () => {
    const validator = new EventScheduleValidator(
      withItems([
        flexItem("e1", "Speech", 60),
        flexItem("e2", "Games", 120), // total 180 <= 720
      ]),
    );
    expect(validator.validateEventDurationWindow().valid).toBe(true);
  });

  it("fails when total duration exceeds the window", () => {
    const validator = new EventScheduleValidator(
      withItems([
        flexItem("e1", "Ceremony", 420), // 7 hr
        flexItem("e2", "Party", 360), // 6 hr — total 780 > 720
      ]),
    );
    const result = validator.validateEventDurationWindow();
    expect(result.valid).toBe(false);
    expect(result.message).toContain("exceeds the schedule time window");
  });

  it("ignores items with a null duration when checking the window", () => {
    const validator = new EventScheduleValidator(
      withItems([
        flexItem("e1", "Intro", null),
        flexItem("e2", "Main", 60), // 60 <= 720
      ]),
    );
    expect(validator.validateEventDurationWindow().valid).toBe(true);
  });

  // -------------------------------------------------------------------
  // validateEventConflicts — window-boundary checks
  // Mirrors: event window 6pm–7pm, item starts/ends outside that edge.
  // -------------------------------------------------------------------

  describe("fixed-time items vs. the schedule window edges", () => {
    const windowForm = (items: EventScheduleItem[]) =>
      withItems(items, { startTime: atTime(18), endTime: atTime(19) }); // 6pm–7pm

    it("passes when there are no fixed-time items", () => {
      const validator = new EventScheduleValidator(
        windowForm([flexItem("e1", "Mingling", 30)]),
      );
      expect(validator.validateEventConflicts().valid).toBe(true);
    });

    it("passes when a fixed item sits fully inside the window", () => {
      const validator = new EventScheduleValidator(
        windowForm([fixedItem("e1", "Toast", atTime(18, 15), 15)]),
      );
      expect(validator.validateEventConflicts().valid).toBe(true);
    });

    it("fails when a fixed item starts before the window start (5pm vs. 6–7pm)", () => {
      const validator = new EventScheduleValidator(
        windowForm([fixedItem("e1", "Setup", atTime(17), 30)]),
      );
      const result = validator.validateEventConflicts();
      expect(result.valid).toBe(false);
      expect(result.message).toContain("outside the schedule time window");
    });

    it("fails when a fixed item ends after the window end (runs past 7pm)", () => {
      const validator = new EventScheduleValidator(
        windowForm([fixedItem("e1", "Speech", atTime(18, 45), 30)]), // ends 7:15pm
      );
      const result = validator.validateEventConflicts();
      expect(result.valid).toBe(false);
      expect(result.message).toContain("outside the schedule time window");
    });

    it("passes when a fixed item starts exactly at the window start", () => {
      const validator = new EventScheduleValidator(
        windowForm([fixedItem("e1", "Doors open", atTime(18), 10)]),
      );
      expect(validator.validateEventConflicts().valid).toBe(true);
    });

    it("passes when a fixed item ends exactly at the window end", () => {
      const validator = new EventScheduleValidator(
        windowForm([fixedItem("e1", "Closing", atTime(18, 30), 30)]), // ends exactly 7pm
      );
      expect(validator.validateEventConflicts().valid).toBe(true);
    });

    it("fails when a zero-duration fixed item lands exactly at 7pm (boundary point, still inside)", () => {
      // A point-in-time item exactly at the window end is still inside.
      const validator = new EventScheduleValidator(
        windowForm([fixedItem("e1", "Farewell", atTime(19), null)]),
      );
      expect(validator.validateEventConflicts().valid).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // validateEventConflicts — fixed-time items overlapping each other
  // -------------------------------------------------------------------

  describe("fixed-time items vs. each other", () => {
    const windowForm = (items: EventScheduleItem[]) =>
      withItems(items, { startTime: atTime(18), endTime: atTime(22) }); // 6pm–10pm

    it("passes when fixed items are sequential (back-to-back, no gap)", () => {
      const validator = new EventScheduleValidator(
        windowForm([
          fixedItem("e1", "Ceremony", atTime(18), 60), // 6:00–7:00
          fixedItem("e2", "Dinner", atTime(19), 60), // 7:00–8:00
        ]),
      );
      expect(validator.validateEventConflicts().valid).toBe(true);
    });

    it("fails when two fixed items overlap", () => {
      const validator = new EventScheduleValidator(
        windowForm([
          fixedItem("e1", "Ceremony", atTime(18), 90), // 6:00–7:30
          fixedItem("e2", "Dinner", atTime(19), 60), // 7:00–8:00 — overlaps
        ]),
      );
      const result = validator.validateEventConflicts();
      expect(result.valid).toBe(false);
      expect(result.message).toContain("conflicts with");
    });

    it("is order-independent when checking overlaps (later item entered first)", () => {
      const validator = new EventScheduleValidator(
        windowForm([
          fixedItem("e2", "Dinner", atTime(19), 60), // 7:00–8:00
          fixedItem("e1", "Ceremony", atTime(18), 90), // 6:00–7:30 — overlaps
        ]),
      );

      const result = validator.validateEventConflicts();

      expect(result.valid).toBe(false);
      expect(result.message).toContain("conflicts with");
    });

    it("passes when a flexible item is mixed in alongside non-overlapping fixed items", () => {
      const validator = new EventScheduleValidator(
        windowForm([
          fixedItem("e1", "Ceremony", atTime(18), 60),
          flexItem("e2", "Mingling", 30),
          fixedItem("e3", "Dinner", atTime(19), 60),
        ]),
      );
      expect(validator.validateEventConflicts().valid).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // validateEventConflicts — overnight (wrapping) windows
  // -------------------------------------------------------------------

  describe("overnight schedule windows", () => {
    const overnightForm = (items: EventScheduleItem[]) =>
      withItems(items, { startTime: atTime(22), endTime: atTime(2) }); // 10pm–2am

    it("treats an early-morning fixed item as inside an overnight window", () => {
      const validator = new EventScheduleValidator(
        overnightForm([fixedItem("e1", "After-party", atTime(1), 30)]), // 1am
      );
      expect(validator.validateEventConflicts().valid).toBe(true);
    });

    it("fails when a fixed item falls before the overnight window's start", () => {
      const validator = new EventScheduleValidator(
        overnightForm([fixedItem("e1", "Too early", atTime(21), 30)]), // 9pm
      );
      expect(validator.validateEventConflicts().valid).toBe(false);
    });

    it("fails when a fixed item falls after the overnight window's end", () => {
      const validator = new EventScheduleValidator(
        overnightForm([fixedItem("e1", "Too late", atTime(3), 30)]), // 3am
      );
      expect(validator.validateEventConflicts().valid).toBe(false);
    });
  });

  // -------------------------------------------------------------------
  // Full 24h window (start === end === 00:00)
  // Regression: window end must be windowStart + 1440, not 0, or every
  // fixed item gets flagged "outside the schedule time window".
  // -------------------------------------------------------------------

  describe("full 24h schedule window (00:00 -> 00:00)", () => {
    const fullDayForm = (items: EventScheduleItem[]) =>
      withItems(items, {
        startTime: new Date("2026-07-07T00:00:00"),
        endTime: new Date("2026-07-07T00:00:00"),
      });

    it("treats a 9am-10am fixed item as inside the full-day window", () => {
      const validator = new EventScheduleValidator(
        fullDayForm([fixedItem("e1", "Morning meeting", atTime(9), 60)]),
      );
      expect(validator.validateEventConflicts().valid).toBe(true);
    });

    it("treats a 11pm-11:30pm fixed item as inside the full-day window", () => {
      const validator = new EventScheduleValidator(
        fullDayForm([fixedItem("e1", "Late block", atTime(23), 30)]),
      );
      expect(validator.validateEventConflicts().valid).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // validateEventItemsPresent
  // -------------------------------------------------------------------

  it("passes when there are no event items", () => {
    const validator = new EventScheduleValidator(baseForm);
    expect(validator.validateEventItemsPresent().valid).toBe(true);
  });

  it("passes when every event item has a name", () => {
    const validator = new EventScheduleValidator(
      withItems([flexItem("e1", "Speech", 60), flexItem("e2", "Games", 30)]),
    );
    expect(validator.validateEventItemsPresent().valid).toBe(true);
  });

  it("fails when any event item is missing a name", () => {
    const validator = new EventScheduleValidator(
      withItems([flexItem("e1", "Speech", 60), flexItem("e2", "   ", 30)]),
    );
    const result = validator.validateEventItemsPresent();
    expect(result.valid).toBe(false);
    expect(result.message).toContain("must have a name");
  });

  // -------------------------------------------------------------------
  // Window math parity with the personal window validator
  // -------------------------------------------------------------------

  it("treats equal start/end times as a full 24h window", () => {
    const validator = new EventScheduleValidator(
      withItems([], { endTime: new Date(baseForm.startTime) }),
    );
    expect(validator.getWindowMinutes()).toBe(24 * 60);
    expect(validator.validateEventDurationWindow().valid).toBe(true);
  });

  it("treats an end time before start time as an overnight window", () => {
    const validator = new EventScheduleValidator(
      withItems([], {
        startTime: new Date("2026-07-07T22:00:00"),
        endTime: new Date("2026-07-07T02:00:00"), // 4h
      }),
    );
    expect(validator.getWindowMinutes()).toBe(4 * 60);
    expect(validator.validateEventDurationWindow().valid).toBe(true);
  });
});
