import type { Activation } from "@/src/activation/domain/Activation";
import { ActivationFactory } from "@/src/activation/domain/ActivationFactory";
import { ConflictResolver } from "@/src/activation/domain/conflict/ConflictResolver";
import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";
import type { ActiveScheduleRepository } from "@/src/repository/activeSchedule.repo";
import type { ActiveScheduleDaysRepository } from "@/src/repository/activeScheduleDays.repo";
import type { CreateActivationInput } from "@/type/ui/schedule/activation.types";

// Fixed date so weekday math is deterministic across runs — we read its
// actual weekday via getDay() below rather than assuming which day it is.
const NEW_DATE = new Date("2026-08-17T00:00:00");
const NEW_DATE_WEEKDAY = NEW_DATE.getDay();

/** Records every id it was asked to delete. */
class FakeActiveScheduleRepository {
  deletedIds: string[] = [];

  async delete(id: string): Promise<void> {
    this.deletedIds.push(id);
  }
}

/** Records every removeActiveScheduleDays call. */
class FakeActiveScheduleDaysRepository {
  removeCalls: Array<{ activeScheduleId: string; weekdays: number[] }> = [];

  async removeActiveScheduleDays(
    activeScheduleId: string,
    weekdays: number[],
  ): Promise<void> {
    this.removeCalls.push({ activeScheduleId, weekdays });
  }
}

const factory = new ActivationFactory();

function buildActivation(overrides: Partial<CreateActivationInput>): Activation {
  const input: CreateActivationInput = {
    scheduleId: "sched-new",
    activeType: "days",
    recurring: false,
    overwrite: false,
    scheduleTimeStart: "08:00",
    sheduleTimeEnd: "09:00",
    ...overrides,
  } as CreateActivationInput;

  return factory.create(input);
}

function makeConflict(overrides: Partial<ScheduleConflict>): ScheduleConflict {
  return {
    id: "conflict-1",
    scheduleName: "Existing Schedule",
    scheduleId: "sched-existing",
    activeType: "days",
    recurring: false,
    ...overrides,
  };
}

describe("ConflictResolver", () => {
  let activeScheduleRepository: FakeActiveScheduleRepository;
  let activeScheduleDaysRepository: FakeActiveScheduleDaysRepository;
  let resolver: ConflictResolver;

  beforeEach(() => {
    activeScheduleRepository = new FakeActiveScheduleRepository();
    activeScheduleDaysRepository = new FakeActiveScheduleDaysRepository();
    resolver = new ConflictResolver(
      activeScheduleRepository as unknown as ActiveScheduleRepository,
      activeScheduleDaysRepository as unknown as ActiveScheduleDaysRepository,
    );
  });

  it("is a no-op when given an empty conflicts list", async () => {
    const context = buildActivation({
      activeType: "days",
      recurring: true,
      selectedDays: [1, 2],
    });

    await resolver.resolve([], context);

    expect(activeScheduleRepository.deletedIds).toEqual([]);
    expect(activeScheduleDaysRepository.removeCalls).toEqual([]);
  });

  describe("resolveForNonOccuringActivation (context.reccuring === false)", () => {
    it("Case 1: Date(new) vs Days non-recurring -> removeActiveScheduleDays with weekday of new date", async () => {
      // New activation: date-type, non-recurring.
      const context = buildActivation({
        activeType: "date",
        recurring: false,
        selectedDate: NEW_DATE,
        nonReccuringDaysTypeStartsAt: NEW_DATE,
      });
      // Existing conflict: days-type, non-recurring, partially overlapping
      // (has one extra day beyond the new date's weekday).
      const conflict = makeConflict({
        id: "days-conflict",
        activeType: "days",
        recurring: false,
        nonOccuring: {
          selectedDays: [NEW_DATE_WEEKDAY, (NEW_DATE_WEEKDAY + 1) % 7],
          selectedDate: "",
          ranges: [],
        },
      });

      await resolver.resolve([conflict], context);

      expect(activeScheduleDaysRepository.removeCalls).toEqual([
        { activeScheduleId: "days-conflict", weekdays: [NEW_DATE_WEEKDAY] },
      ]);
      expect(activeScheduleRepository.deletedIds).toEqual([]);
    });

    it("Case 2: Date(new) vs Date -> delete(conflictId)", async () => {
      const context = buildActivation({
        activeType: "date",
        recurring: false,
        selectedDate: NEW_DATE,
        nonReccuringDaysTypeStartsAt: NEW_DATE,
      });
      const conflict = makeConflict({
        id: "date-conflict",
        activeType: "date",
        recurring: false,
      });

      await resolver.resolve([conflict], context);

      expect(activeScheduleRepository.deletedIds).toEqual(["date-conflict"]);
      expect(activeScheduleDaysRepository.removeCalls).toEqual([]);
    });

    it("Case 3: Any non-recurring(new) vs Recurring(existing) -> skipped", async () => {
      // Non-recurring is "stronger" — it overwrites recurring conflicts
      // wholesale later on, so the non-recurring branch does nothing here.
      const context = buildActivation({
        activeType: "date",
        recurring: false,
        selectedDate: NEW_DATE,
        nonReccuringDaysTypeStartsAt: NEW_DATE,
      });
      const conflict = makeConflict({
        id: "recurring-conflict",
        activeType: "days",
        recurring: true,
        occuring: {
          selectedDays: [NEW_DATE_WEEKDAY],
          windowStartMin: 0,
          windowEndMin: 60,
        },
      });

      await resolver.resolve([conflict], context);

      expect(activeScheduleRepository.deletedIds).toEqual([]);
      expect(activeScheduleDaysRepository.removeCalls).toEqual([]);
    });

    it("Case 4: Days non-recurring(new) vs Date -> delete(conflictId)", async () => {
      const context = buildActivation({
        activeType: "days",
        recurring: false,
        selectedDays: [1, 2],
        nonReccuringDaysTypeStartsAt: NEW_DATE,
      });
      const conflict = makeConflict({
        id: "date-conflict",
        activeType: "date",
        recurring: false,
      });

      await resolver.resolve([conflict], context);

      expect(activeScheduleRepository.deletedIds).toEqual(["date-conflict"]);
      expect(activeScheduleDaysRepository.removeCalls).toEqual([]);
    });

    it("Case 5: Days non-recurring(new) vs Days non-recurring, partial overlap -> removeActiveScheduleDays", async () => {
      const context = buildActivation({
        activeType: "days",
        recurring: false,
        selectedDays: [1, 2],
        nonReccuringDaysTypeStartsAt: NEW_DATE,
      });
      // Existing has an extra day (3) not covered by the new activation, so
      // it can't be fully removed — only the overlapping days are stripped.
      const conflict = makeConflict({
        id: "days-conflict",
        activeType: "days",
        recurring: false,
        nonOccuring: { selectedDays: [1, 2, 3], selectedDate: "", ranges: [] },
      });

      await resolver.resolve([conflict], context);

      expect(activeScheduleDaysRepository.removeCalls).toEqual([
        { activeScheduleId: "days-conflict", weekdays: [1, 2] },
      ]);
      expect(activeScheduleRepository.deletedIds).toEqual([]);
    });

    it("Case 5b: Days non-recurring(new) vs Days non-recurring, full overlap -> delete(conflictId)", async () => {
      const context = buildActivation({
        activeType: "days",
        recurring: false,
        selectedDays: [1, 2, 3],
        nonReccuringDaysTypeStartsAt: NEW_DATE,
      });
      // Every day of the existing conflict is covered by the new activation,
      // so nothing remains — the whole conflicting activation is removed.
      const conflict = makeConflict({
        id: "days-conflict",
        activeType: "days",
        recurring: false,
        nonOccuring: { selectedDays: [1, 2], selectedDate: "", ranges: [] },
      });

      await resolver.resolve([conflict], context);

      expect(activeScheduleRepository.deletedIds).toEqual(["days-conflict"]);
      expect(activeScheduleDaysRepository.removeCalls).toEqual([]);
    });
  });

  describe("resolveOccurringActivation (context.reccuring === true)", () => {
    it("Case A: Recurring(new) vs Recurring, partial overlap -> removeActiveScheduleDays", async () => {
      const context = buildActivation({
        activeType: "days",
        recurring: true,
        selectedDays: [1, 2],
      });
      const conflict = makeConflict({
        id: "recurring-conflict",
        activeType: "days",
        recurring: true,
        occuring: { selectedDays: [1, 2, 3], windowStartMin: 0, windowEndMin: 60 },
      });

      await resolver.resolve([conflict], context);

      expect(activeScheduleDaysRepository.removeCalls).toEqual([
        { activeScheduleId: "recurring-conflict", weekdays: [1, 2] },
      ]);
      expect(activeScheduleRepository.deletedIds).toEqual([]);
    });

    it("Case B: Recurring(new) vs Recurring, full overlap -> delete(conflictId)", async () => {
      const context = buildActivation({
        activeType: "days",
        recurring: true,
        selectedDays: [1, 2, 3],
      });
      const conflict = makeConflict({
        id: "recurring-conflict",
        activeType: "days",
        recurring: true,
        occuring: { selectedDays: [1, 2], windowStartMin: 0, windowEndMin: 60 },
      });

      await resolver.resolve([conflict], context);

      expect(activeScheduleRepository.deletedIds).toEqual(["recurring-conflict"]);
      expect(activeScheduleDaysRepository.removeCalls).toEqual([]);
    });

    it("Case C: Recurring(new) vs Non-recurring(existing) -> skipped", async () => {
      // Non-recurring existing activations are "stronger" — the recurring
      // branch only ever touches conflicts flagged as recurring.
      const context = buildActivation({
        activeType: "days",
        recurring: true,
        selectedDays: [1, 2],
      });
      const conflict = makeConflict({
        id: "non-recurring-conflict",
        activeType: "days",
        recurring: false,
        nonOccuring: { selectedDays: [1], selectedDate: "", ranges: [] },
      });

      await resolver.resolve([conflict], context);

      expect(activeScheduleRepository.deletedIds).toEqual([]);
      expect(activeScheduleDaysRepository.removeCalls).toEqual([]);
    });
  });
});
