import type { CreateActivationInput } from "@/type/ui/schedule/activation.types";
import { AddActivationService } from "./AddActivationService";
import { ActivationFactory } from "./domain/ActivationFactory";

// ---------------------------------------------------------------------------
// Test doubles for the three collaborators that AddActivationService delegates
// to.  They are all interfaces, so we instantiate them with jest.fn().
// ---------------------------------------------------------------------------

const mockConflictDetector = { detect: jest.fn() };
const mockConflictResolver = { resolve: jest.fn() };
const mockActivationRepository = { create: jest.fn() };

/**
 * Builds a service whose ActivationFactory is the *real* one.  This lets us
 * verify the end-to-end output of the factory aggregate.
 */
function makeService() {
  return new AddActivationService(
    mockConflictDetector as any,
    mockConflictResolver as any,
    mockActivationRepository as any,
    new ActivationFactory(),
  );
}

describe("AddActivationService — activation + factory output", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===================================================================
  // Recurring days  (activeType = "days", recurring = true)
  // ===================================================================
  describe("day type — recurring", () => {
    it("produces occuringOverflow with windowStartMin / windowEndMin for a regular daytime schedule", async () => {
      const input: CreateActivationInput = {
        scheduleId: "sched-rec-day",
        activeType: "days",
        recurring: true,
        overwrite: true,
        selectedDays: [1, 3, 5], // Mon, Wed, Fri
        scheduleTimeStart: "08:00",
        sheduleTimeEnd: "16:00",
      };

      await makeService().add(input);

      // Factory output (via getDayTypeOccuring) --------------------------------
      const context = new ActivationFactory().create(input);
      const { days, occuringOverflow } = context.getDayTypeOccuring();

      expect(days).toHaveLength(3);
      expect(days.map((d) => d.weekday).sort()).toEqual([1, 3, 5]);
      expect(days.every((d) => d.activeId === context.id)).toBe(true);
      expect(days.every((d) => d.id)).toBeTruthy();

      expect(occuringOverflow.activeId).toBe(context.id);
      expect(occuringOverflow.windowStartMin).toBe(480); // 08:00 → 8*60
      expect(occuringOverflow.windowEndMin).toBe(960); // 16:00 → 16*60
      expect(occuringOverflow.id).toBeTruthy();
    });

    it("handles a night shift by wrapping windowEndMin past midnight (+24h)", async () => {
      const input: CreateActivationInput = {
        scheduleId: "sched-night",
        activeType: "days",
        recurring: true,
        overwrite: true,
        selectedDays: [2], // Tuesday
        scheduleTimeStart: "22:00",
        sheduleTimeEnd: "06:00",
      };

      await makeService().add(input);

      const context = new ActivationFactory().create(input);
      const { occuringOverflow } = context.getDayTypeOccuring();

      // 22:00 → 1320 min; 06:00 → 360 min.
      // Because 360 ≤ 1320 the factory adds 24*60 = 1440 → 1800.
      expect(occuringOverflow.windowStartMin).toBe(1320);
      expect(occuringOverflow.windowEndMin).toBe(1800);
    });
  });

  // ===================================================================
  // Non-recurring days  (activeType = "days", recurring = false)
  // ===================================================================
  describe("day type — non-recurring", () => {
    // Aug 17 2026 is a Monday — a weekday that is in the selectedDays arrays
    // below ([1,3,5] and [1]), matching what useSetActiveModal.buildPayload
    // produces via resolveRangeStart (the start date always lands on a
    // selected weekday).
    const startDate = new Date("2026-08-17T00:00:00");

    it("creates one NonOccuringWindowRange per selected day, each offset by dayIndex from startDate", async () => {
      const input: CreateActivationInput = {
        scheduleId: "sched-days-nonrec",
        activeType: "days",
        recurring: false,
        overwrite: true,
        selectedDays: [1, 3, 5], // Mon, Wed, Fri (arbitrary weekday selection)
        nonReccuringDaysTypeStartsAt: startDate,
        scheduleTimeStart: "08:00",
        sheduleTimeEnd: "16:00",
      };

      await makeService().add(input);

      const context = new ActivationFactory().create(input);
      const { days, ranges } = context.getDayTypeNonOccuring();

      // --- days array ---
      expect(days).toHaveLength(3);
      expect(days.map((d) => d.weekday).sort()).toEqual([1, 3, 5]);

      // --- ranges array ---
      expect(ranges).toHaveLength(3);
      expect(ranges.length).toBe(days.length); // one range per day

      // Range 0 → startDate + 0 days (Mon, day 1)
      expect(ranges[0].startsAt.getHours()).toBe(8);
      expect(ranges[0].startsAt.getMinutes()).toBe(0);
      expect(ranges[0].endsAt.getHours()).toBe(16);
      expect(ranges[0].endsAt.getMinutes()).toBe(0);
      // Same calendar day — no midnight crossing
      expect(ranges[0].startsAt.getDay()).toBe(ranges[0].endsAt.getDay());
      expect(ranges[0].startsAt.getDay()).toBe(1); // Monday

      // Range 1 → startDate + 1 day (Tue, day 2)
      expect(ranges[1].startsAt.getDay()).toBe(2);

      // Range 2 → startDate + 2 days (Wed, day 3)
      expect(ranges[2].startsAt.getDay()).toBe(3);

      // Each range is exactly one calendar day apart
      expect(ranges[1].startsAt.getDate()).toBe(ranges[0].startsAt.getDate() + 1);
      expect(ranges[2].startsAt.getDate()).toBe(ranges[1].startsAt.getDate() + 1);
    });

    it("handles night shift in non-recurring ranges by moving endsAt to the next day", async () => {
      const input: CreateActivationInput = {
        scheduleId: "sched-night-nonrec",
        activeType: "days",
        recurring: false,
        overwrite: true,
        selectedDays: [1], // Monday
        nonReccuringDaysTypeStartsAt: startDate,
        scheduleTimeStart: "22:00",
        sheduleTimeEnd: "06:00",
      };

      await makeService().add(input);

      const context = new ActivationFactory().create(input);
      const { ranges } = context.getDayTypeNonOccuring();

      // startsAt on startDate (Monday) at 22:00
      expect(ranges[0].startsAt.getHours()).toBe(22);
      expect(ranges[0].startsAt.getMinutes()).toBe(0);
      expect(ranges[0].startsAt.getDay()).toBe(1); // Monday

      // endsAt should wrap to the next day (Tuesday) at 06:00
      expect(ranges[0].endsAt.getHours()).toBe(6);
      expect(ranges[0].endsAt.getMinutes()).toBe(0);
      expect(ranges[0].endsAt.getDay()).toBe(2); // Tuesday
      expect(ranges[0].endsAt.getDate()).toBe(ranges[0].startsAt.getDate() + 1);
    });
  });

  // ===================================================================
  // Date type  (activeType = "date", always non-recurring)
  // ===================================================================
  describe("date type", () => {
    it("creates an ActiveScheduleDate and a single NonOccuringWindowRange for a regular daytime schedule", async () => {
      const selectedDate = new Date("2026-08-20T00:00:00"); // Thursday

      const input: CreateActivationInput = {
        scheduleId: "sched-date",
        activeType: "date",
        recurring: false,
        overwrite: true,
        selectedDate,
        nonReccuringDaysTypeStartsAt: selectedDate,
        scheduleTimeStart: "09:00",
        sheduleTimeEnd: "17:00",
      };

      await makeService().add(input);

      const context = new ActivationFactory().create(input);
      const { date, range } = context.getDateType();

      // --- ActiveScheduleDate ---
      expect(date.activeId).toBe(context.id);
      expect(date.date.getTime()).toBe(selectedDate.getTime());

      // --- NonOccuringWindowRange ---
      expect(range.activeId).toBe(context.id);
      expect(range.startsAt.getHours()).toBe(9);
      expect(range.startsAt.getMinutes()).toBe(0);
      expect(range.endsAt.getHours()).toBe(17);
      expect(range.endsAt.getMinutes()).toBe(0);
      // Same calendar day — no midnight crossing
      expect(range.startsAt.getDay()).toBe(range.endsAt.getDay());
      expect(range.startsAt.getDay()).toBe(4); // Thursday
    });

    it("handles a night shift in date type by moving endsAt to the next day", async () => {
      const selectedDate = new Date("2026-08-20T00:00:00"); // Thursday

      const input: CreateActivationInput = {
        scheduleId: "sched-date-night",
        activeType: "date",
        recurring: false,
        overwrite: true,
        selectedDate,
        nonReccuringDaysTypeStartsAt: selectedDate,
        scheduleTimeStart: "23:00",
        sheduleTimeEnd: "07:00",
      };

      await makeService().add(input);

      const context = new ActivationFactory().create(input);
      const { range } = context.getDateType();

      // startsAt on the selected date at 23:00
      expect(range.startsAt.getHours()).toBe(23);
      expect(range.startsAt.getMinutes()).toBe(0);
      expect(range.startsAt.getDay()).toBe(4); // Thursday

      // endsAt should wrap to the next day (Friday) at 07:00
      expect(range.endsAt.getHours()).toBe(7);
      expect(range.endsAt.getMinutes()).toBe(0);
      expect(range.endsAt.getDay()).toBe(5); // Friday
      expect(range.endsAt.getDate()).toBe(21); // Aug 21
    });
  });

  // ===================================================================
  // Validation / error paths
  // ===================================================================
  describe("error handling", () => {
    it("throws when day type has no selected days", () => {
      const input: CreateActivationInput = {
        scheduleId: "sched-empty",
        activeType: "days",
        recurring: true,
        overwrite: true,
        scheduleTimeStart: "08:00",
        sheduleTimeEnd: "16:00",
      };

      expect(() => new ActivationFactory().create(input)).toThrow(
        "No selected days detected",
      );
    });

    it("throws when date type has no selectedDate", () => {
      const input: CreateActivationInput = {
        scheduleId: "sched-no-date",
        activeType: "date",
        recurring: false,
        overwrite: true,
        scheduleTimeStart: "08:00",
        sheduleTimeEnd: "16:00",
      };

      expect(() => new ActivationFactory().create(input)).toThrow(
        "Date type activation requires selected date",
      );
    });
  });
});
