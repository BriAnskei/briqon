import EventScheduleValidator from "../EventScheduleValidator";
import type { NewScheduleFormState } from "@/type/NewScheduleTypes";

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
    eventScheduleItems: NewScheduleFormState["eventScheduleItems"],
    overrides: Partial<NewScheduleFormState> = {},
  ): NewScheduleFormState {
    return { ...baseForm, eventScheduleItems, ...overrides };
  }

  // -------------------------------------------------------------------
  // Duration parsing
  // -------------------------------------------------------------------

  it("parses hours, minutes, and combined durations", () => {
    const form = withItems([
      { id: "e1", name: "Speech", duration: "1 hr" },
      { id: "e2", name: "Games", duration: "45 min" },
      { id: "e3", name: "Dinner", duration: "1 hr 30 min" },
    ]);
    const validator = new EventScheduleValidator(form);
    expect(validator.getEventTotalMinutes()).toBe(60 + 45 + 90);
  });

  it("accepts bare-number durations as minutes", () => {
    const validator = new EventScheduleValidator(
      withItems([{ id: "e1", name: "Talk", duration: "90" }]),
    );
    expect(validator.getEventTotalMinutes()).toBe(90);
  });

  it("treats unparseable durations as unknown (skipped, not failing)", () => {
    const validator = new EventScheduleValidator(
      withItems([
        { id: "e1", name: "Intro", duration: "TBD" },
        { id: "e2", name: "Games", duration: "30 min" },
      ]),
    );
    // "TBD" is skipped, only the parseable 30 min counts.
    expect(validator.getEventTotalMinutes()).toBe(30);
  });

  it("treats an empty duration as unknown rather than zero/handled", () => {
    const validator = new EventScheduleValidator(
      withItems([{ id: "e1", name: "Open", duration: "" }]),
    );
    expect(validator.getEventTotalMinutes()).toBe(0);
  });

  // -------------------------------------------------------------------
  // validateEventDurationWindow
  // -------------------------------------------------------------------

  it("passes when no measurable durations are present", () => {
    const validator = new EventScheduleValidator(
      withItems([{ id: "e1", name: "Free play", duration: "" }]),
    );
    expect(validator.validateEventDurationWindow().valid).toBe(true);
  });

  it("passes when parseable durations fit inside the window", () => {
    const validator = new EventScheduleValidator(
      withItems([
        { id: "e1", name: "Speech", duration: "1 hr" },
        { id: "e2", name: "Games", duration: "2 hr" }, // total 180 <= 720
      ]),
    );
    expect(validator.validateEventDurationWindow().valid).toBe(true);
  });

  it("fails when total parseable duration exceeds the window", () => {
    const validator = new EventScheduleValidator(
      withItems([
        { id: "e1", name: "Ceremony", duration: "6 hr" },
        { id: "e2", name: "Party", duration: "6 hr" }, // total 720 > 720? no; add buffer
      ]),
    );
    const over = new EventScheduleValidator(
      withItems([
        { id: "e1", name: "Ceremony", duration: "7 hr" },
        { id: "e2", name: "Party", duration: "6 hr" }, // 780 > 720
      ]),
    );
    expect(validator.validateEventDurationWindow().valid).toBe(true);
    const result = over.validateEventDurationWindow();
    expect(result.valid).toBe(false);
    expect(result.message).toContain("exceeds the schedule time window");
  });

  it("ignores unparseable durations when checking the window", () => {
    const validator = new EventScheduleValidator(
      withItems([
        { id: "e1", name: "Intro", duration: "unknown" },
        { id: "e2", name: "Main", duration: "1 hr" }, // 60 <= 720
      ]),
    );
    expect(validator.validateEventDurationWindow().valid).toBe(true);
  });

  // -------------------------------------------------------------------
  // validateEventConflicts (sequential back-to-back run)
  // -------------------------------------------------------------------

  it("passes when fewer than two measurable segments exist", () => {
    const validator = new EventScheduleValidator(
      withItems([{ id: "e1", name: "Speech", duration: "2 hr" }]),
    );
    expect(validator.validateEventConflicts().valid).toBe(true);
  });

  it("passes when sequential segments fit within the window", () => {
    const validator = new EventScheduleValidator(
      withItems([
        { id: "e1", name: "Speech", duration: "2 hr" },
        { id: "e2", name: "Games", duration: "3 hr" }, // running 300 <= 720
      ]),
    );
    expect(validator.validateEventConflicts().valid).toBe(true);
  });

  it("fails when sequential segments overrun the window mid-program", () => {
    const validator = new EventScheduleValidator(
      withItems([
        { id: "e1", name: "Ceremony", duration: "5 hr" },
        { id: "e2", name: "Dinner", duration: "4 hr" }, // 9 hr > 12 hr? no
      ]),
    );
    const over = new EventScheduleValidator(
      withItems([
        { id: "e1", name: "Ceremony", duration: "8 hr" },
        { id: "e2", name: "Dinner", duration: "5 hr" }, // running 13 hr > 12 hr
      ]),
    );
    expect(validator.validateEventConflicts().valid).toBe(true);
    expect(over.validateEventConflicts().valid).toBe(false);
  });

  it("skips unparseable durations when computing the sequential run", () => {
    const validator = new EventScheduleValidator(
      withItems([
        { id: "e1", name: "Intro", duration: "TBD" },
        { id: "e2", name: "Main", duration: "2 hr" },
        { id: "e3", name: "Wrap", duration: "3 hr" }, // 300 <= 720
      ]),
    );
    expect(validator.validateEventConflicts().valid).toBe(true);
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
      withItems([
        { id: "e1", name: "Speech", duration: "1 hr" },
        { id: "e2", name: "Games", duration: "30 min" },
      ]),
    );
    expect(validator.validateEventItemsPresent().valid).toBe(true);
  });

  it("fails when any event item is missing a name", () => {
    const validator = new EventScheduleValidator(
      withItems([
        { id: "e1", name: "Speech", duration: "1 hr" },
        { id: "e2", name: "   ", duration: "30 min" }, // blank name
      ]),
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
