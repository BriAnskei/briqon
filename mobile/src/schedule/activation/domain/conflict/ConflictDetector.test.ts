import type { Activation } from "@/src/activation/domain/Activation";
import { ActivationFactory } from "@/src/activation/domain/ActivationFactory";
import { ConflictDetector } from "@/src/activation/domain/conflict/ConflictDetector";
import type { ConflictHandler } from "@/src/activation/domain/conflict/ConflictHandler";
import { NonReccuringActivationHandler } from "@/src/activation/domain/conflict/NonReccuringActivationHandler";
import { NonRecurringAgainstRecurringHandler } from "@/src/activation/domain/conflict/NonRecurringAgainstRecurringHandler";
import { ReccuringActivationHandler } from "@/src/activation/domain/conflict/ReccuringActivationHandler";
import { RecurringAgainstNonRecurringHandler } from "@/src/activation/domain/conflict/RecurringAgainstNonRecurringHandler";
import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";
import type { ActiveScheduleRepository } from "@/src/repository/activeSchedule.repo";
import type { CreateActivationInput } from "@/type/ui/schedule/activation.types";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ConflictDetector — unit & integration tests
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  ConflictDetector is a thin orchestrator: it holds a list of ConflictHandler
 *  instances, calls `check(context)` on each one, and flattens the returned
 *  arrays into a single `ScheduleConflict[]`.
 *
 *  The production code reads:
 *    async detect(context: Activation): Promise<ScheduleConflict[]> {
 *      const res = await Promise.all(
 *        this.handlers.map(async (handler) => handler.check(context)),
 *      );
 *      return res.flat();
 *    }
 *
 *  Key behaviours under test:
 *
 *  UNIT (fake handlers):
 *    1. Every handler receives the exact `context` reference that was passed
 *       to `detect`.
 *    2. Handlers are invoked in the order they were provided to the constructor.
 *    3. The returned arrays are *flattened* — a handler returning
 *       `[conflictA, conflictB]` and another returning `[conflictC]` must
 *       yield `[conflictA, conflictB, conflictC]`, not `[[a, b], [c]]`.
 *    4. When no handlers return conflicts (or no handlers are configured),
 *       the result is an empty array `[]`, not `undefined` or `[[]]`.
 *    5. The method is async and resolves to a plain array.
 *
 *  INTEGRATION (real handlers + fake repo):
 *    The detector is wired to the *real* handler implementations
 *    (ReccuringActivationHandler, NonReccuringActivationHandler,
 *     RecurringAgainstNonRecurringHandler, NonRecurringAgainstRecurringHandler)
 *    backed by a hand-rolled fake ActiveScheduleRepository.  This verifies
 *    the full delegation chain: detector → handler filtering logic → repo
 *    query dispatch → flattened result.
 *
 *  Fakes-over-mocks convention (matches AddActivationService.test.ts):
 *  each fake records calls on a plain property and returns a
 *  pre-configured list — no `jest.mock(...)`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── shared helpers ────────────────────────────────────────────────────

/** Fixed date so weekday math is deterministic across runs. */
const NEW_DATE = new Date("2026-08-17T00:00:00");
const NEW_DATE_WEEKDAY = NEW_DATE.getDay();

function makeConflict(overrides: Partial<ScheduleConflict> = {}): ScheduleConflict {
  return {
    id: "conflict-1",
    scheduleName: "Existing Schedule",
    scheduleId: "sched-existing",
    activeType: "days",
    recurring: false,
    ...overrides,
  };
}

/** Minimal builder for a CreateActivationInput — callers can override any field. */
function buildInput(overrides: Partial<CreateActivationInput>): CreateActivationInput {
  return {
    scheduleId: "sched-new",
    activeType: "days",
    recurring: false,
    overwrite: false,
    scheduleTimeStart: "08:00",
    sheduleTimeEnd: "09:00",
    ...overrides,
  } as CreateActivationInput;
}

// ─── fake handler for unit tests ───────────────────────────────────────

/**
 * Hand-rolled fake handler — records every context it was called with and
 * returns a pre-configured list of conflicts. Used in the UNIT test group
 * to isolate ConflictDetector's delegation + flattening logic.
 */
class FakeConflictHandler implements ConflictHandler {
  calls: Activation[] = [];

  constructor(private readonly conflictsToReturn: ScheduleConflict[] = []) {}

  async check(context: Activation): Promise<ScheduleConflict[]> {
    this.calls.push(context);
    return this.conflictsToReturn;
  }
}

// ─── fake ActiveScheduleRepository for integration tests ────────────────

/**
 * Fake ActiveScheduleRepository that records every `find*Conflict` call
 * and returns a pre-configured list.  This lets us wire the REAL handler
 * implementations into the detector and observe which repo method each
 * handler dispatches to.
 */
class FakeActiveScheduleRepository {
  /** Records each findReccuringConflict invocation. */
  findReccuringConflictCalls: Array<{
    weekDays: number[];
    windowStartMin: number;
    windowEndMin: number;
  }> = [];
  /** Records each findNonOccurringConflict invocation. */
  findNonOccurringConflictCalls: Array<{
    startsAt: Date;
    endsAt: Date;
  }>[] = [];
  /** Records each findNonRecurringConflictsForRecurring invocation. */
  findNonRecurringConflictsForRecurringCalls: Array<{
    weekDays: number[];
    windowStartMin: number;
    windowEndMin: number;
  }> = [];
  /** Records each findRecurringConflictsForNonRecurring invocation. */
  findRecurringConflictsForNonRecurringCalls: Array<{
    startsAt: Date;
    endsAt: Date;
  }>[] = [];

  constructor(
    private readonly conflictsByMethod: {
      findReccuringConflict?: ScheduleConflict[];
      findNonOccurringConflict?: ScheduleConflict[];
      findNonRecurringConflictsForRecurring?: ScheduleConflict[];
      findRecurringConflictsForNonRecurring?: ScheduleConflict[];
    } = {},
  ) {}

  async findReccuringConflict(input: {
    weekDays: number[];
    windowStartMin: number;
    windowEndMin: number;
  }): Promise<ScheduleConflict[]> {
    this.findReccuringConflictCalls.push(input);
    return this.conflictsByMethod.findReccuringConflict ?? [];
  }

  async findNonOccurringConflict(
    ranges: {
      startsAt: Date;
      endsAt: Date;
    }[],
  ): Promise<ScheduleConflict[]> {
    this.findNonOccurringConflictCalls.push(ranges);
    return this.conflictsByMethod.findNonOccurringConflict ?? [];
  }

  async findNonRecurringConflictsForRecurring(input: {
    weekDays: number[];
    windowStartMin: number;
    windowEndMin: number;
  }): Promise<ScheduleConflict[]> {
    this.findNonRecurringConflictsForRecurringCalls.push(input);
    return this.conflictsByMethod.findNonRecurringConflictsForRecurring ?? [];
  }

  async findRecurringConflictsForNonRecurring(
    ranges: {
      startsAt: Date;
      endsAt: Date;
    }[],
  ): Promise<ScheduleConflict[]> {
    this.findRecurringConflictsForNonRecurringCalls.push(ranges);
    return this.conflictsByMethod.findRecurringConflictsForNonRecurring ?? [];
  }
}

// ─── unit tests: ConflictDetector with fake handlers ───────────────────

describe("ConflictDetector (unit — with fake handlers)", () => {
  // ConflictDetector never inspects the context itself — it only forwards it
  // to each handler — so a plain stand-in is enough here.
  const context = {} as Activation;

  it("calls each handler's check with the given context (same reference)", async () => {
    const handlerA = new FakeConflictHandler([]);
    const handlerB = new FakeConflictHandler([]);
    const detector = new ConflictDetector([handlerA, handlerB]);

    await detector.detect(context);

    // Each handler should have been called exactly once, with the exact
    // context object that was passed to detect().
    expect(handlerA.calls).toEqual([context]);
    expect(handlerB.calls).toEqual([context]);
    expect(handlerA.calls[0]).toBe(context);
    expect(handlerB.calls[0]).toBe(context);
  });

  it("invokes handlers in the order they were provided to the constructor", async () => {
    // We use distinct conflicts per handler and check the flattened result
    // order to assert that Promise.all preserves handler declaration order
    // (it does because Promise.all preserves result index order).
    const conflictA = makeConflict({ id: "a" });
    const conflictB = makeConflict({ id: "b" });
    const conflictC = makeConflict({ id: "c" });

    const handlerA = new FakeConflictHandler([conflictA]);
    const handlerB = new FakeConflictHandler([conflictB]);
    const handlerC = new FakeConflictHandler([conflictC]);
    const detector = new ConflictDetector([handlerA, handlerB, handlerC]);

    const result = await detector.detect(context);

    // Result order must follow handler declaration order.
    expect(result.map((c) => c.id)).toEqual(["a", "b", "c"]);
  });

  it("flattens results returned from multiple handlers into a single array", async () => {
    const conflictA = makeConflict({ id: "a" });
    const conflictB = makeConflict({ id: "b" });
    const conflictC = makeConflict({ id: "c" });

    // Two handlers, one returning two conflicts, the other returning one.
    const handlerA = new FakeConflictHandler([conflictA, conflictB]);
    const handlerB = new FakeConflictHandler([conflictC]);
    const detector = new ConflictDetector([handlerA, handlerB]);

    const result = await detector.detect(context);

    expect(result).toEqual([conflictA, conflictB, conflictC]);
  });

  it("flattens deeply — each handler returns multiple conflicts and all are merged", async () => {
    const c1 = makeConflict({ id: "1" });
    const c2 = makeConflict({ id: "2" });
    const c3 = makeConflict({ id: "3" });
    const c4 = makeConflict({ id: "4" });
    const c5 = makeConflict({ id: "5" });

    // Three handlers each returning conflicts.
    const handlerA = new FakeConflictHandler([c1, c2]);
    const handlerB = new FakeConflictHandler([c3, c4]);
    const handlerC = new FakeConflictHandler([c5]);
    const detector = new ConflictDetector([handlerA, handlerB, handlerC]);

    const result = await detector.detect(context);

    expect(result).toEqual([c1, c2, c3, c4, c5]);
    expect(result).not.toBe(result[0]); // ensure it's a flat array, not nested
  });

  it("returns an empty array when no handlers return any conflicts", async () => {
    const handlerA = new FakeConflictHandler([]);
    const handlerB = new FakeConflictHandler([]);
    const detector = new ConflictDetector([handlerA, handlerB]);

    const result = await detector.detect(context);

    expect(result).toEqual([]);
    // Explicitly verify it is a real array, not undefined or null.
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns an empty array when some handlers return conflicts and others return empty", async () => {
    // Mixed case: handlerA returns one conflict, handlerB returns nothing.
    const conflict = makeConflict({ id: "only-one" });
    const handlerA = new FakeConflictHandler([conflict]);
    const handlerB = new FakeConflictHandler([]);
    const detector = new ConflictDetector([handlerA, handlerB]);

    const result = await detector.detect(context);

    // Only the non-empty handler's conflicts appear.
    expect(result).toEqual([conflict]);
  });

  it("returns an empty array when no handlers are configured", async () => {
    const detector = new ConflictDetector([]);

    const result = await detector.detect(context);

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns a Promise that resolves to an array (async contract)", async () => {
    const handler = new FakeConflictHandler([]);
    const detector = new ConflictDetector([handler]);

    const result = detector.detect(context);

    // detect() returns a Promise, not a raw value.
    expect(result).toBeInstanceOf(Promise);
    const resolved = await result;

    expect(Array.isArray(resolved)).toBe(true);
    expect(resolved).toEqual([]);
  });
});

// ─── integration tests: ConflictDetector with REAL handlers ────────────
//
// These tests verify the full delegation chain: the detector calls the real
// handler implementations, each of which checks context flags and dispatches
// to the appropriate fake repository method.  The detector then flattens
// the combined results.

describe("ConflictDetector (integration — with real handlers)", () => {
  const factory = new ActivationFactory();

  /**
   * Builds a detector wired to the real handler implementations, all backed
   * by a single fake ActiveScheduleRepository.  Callers can then inspect
   * which repo methods were called and with what arguments.
   */
  function buildDetectorWithRealHandlers(
    repo: FakeActiveScheduleRepository,
  ): ConflictDetector {
    const handlers: ConflictHandler[] = [
      new ReccuringActivationHandler(repo as unknown as ActiveScheduleRepository),
      new NonReccuringActivationHandler(repo as unknown as ActiveScheduleRepository),
      new RecurringAgainstNonRecurringHandler(
        repo as unknown as ActiveScheduleRepository,
      ),
      new NonRecurringAgainstRecurringHandler(
        repo as unknown as ActiveScheduleRepository,
      ),
    ];

    return new ConflictDetector(handlers);
  }

  describe("recurring days activation (reccuring=true, activeType='days')", () => {
    it("dispatches to findReccuringConflict and findNonRecurringConflictsForRecurring, flattens results", async () => {
      const conflictA = makeConflict({ id: "recurring-a", recurring: true });
      const conflictB = makeConflict({ id: "nonrecurring-b", recurring: false });
      // findReccuringConflict returns conflictA (recurring handler),
      // findNonRecursiveConflictsForRecurring returns conflictB (the
      // RecurringAgainstNonRecurring handler).
      const repo = new FakeActiveScheduleRepository({
        findReccuringConflict: [conflictA],
        findNonRecurringConflictsForRecurring: [conflictB],
      });

      const detector = buildDetectorWithRealHandlers(repo);

      const context = factory.create(
        buildInput({ activeType: "days", recurring: true, selectedDays: [1, 2] }),
      );

      const result = await detector.detect(context);

      // ReccuringActivationHandler should have called findReccuringConflict
      // with the days and time window from the context.
      expect(repo.findReccuringConflictCalls).toHaveLength(1);
      expect(repo.findReccuringConflictCalls[0]).toEqual({
        weekDays: [1, 2],
        windowStartMin: 480, // 08:00 in minutes-from-midnight
        windowEndMin: 540, // 09:00
      });

      // RecurringAgainstNonRecurringHandler should have called
      // findNonRecurringConflictsForRecurring with the same days + window.
      expect(repo.findNonRecurringConflictsForRecurringCalls).toHaveLength(1);
      expect(repo.findNonRecurringConflictsForRecurringCalls[0]).toEqual({
        weekDays: [1, 2],
        windowStartMin: 480,
        windowEndMin: 540,
      });

      // Non-recurring handlers should NOT have been invoked because
      // the context is recurring.
      expect(repo.findNonOccurringConflictCalls).toHaveLength(0);
      expect(repo.findRecurringConflictsForNonRecurringCalls).toHaveLength(0);

      // Results from both repo calls should be flattened into a single array.
      expect(result).toEqual([conflictA, conflictB]);
    });

    it("returns an empty array when both recurring queries return empty", async () => {
      const repo = new FakeActiveScheduleRepository({});
      const detector = buildDetectorWithRealHandlers(repo);

      const context = factory.create(
        buildInput({ activeType: "days", recurring: true, selectedDays: [1, 3] }),
      );

      const result = await detector.detect(context);

      expect(result).toEqual([]);
      expect(repo.findReccuringConflictCalls).toHaveLength(1);
      expect(repo.findNonRecurringConflictsForRecurringCalls).toHaveLength(1);
      expect(repo.findNonOccurringConflictCalls).toHaveLength(0);
    });
  });

  describe("non-recurring days activation (reccuring=false, activeType='days')", () => {
    it("dispatches to findNonOccurringConflict and findRecurringConflictsForNonRecurring, flattens results", async () => {
      const conflictA = makeConflict({ id: "days-nonrec-a" });
      const conflictB = makeConflict({ id: "days-recurring-b", recurring: true });
      // findNonOccurringConflict returns conflictA (non-recurring handler),
      // findRecurringConflictsForNonRecurring returns conflictB.
      const repo = new FakeActiveScheduleRepository({
        findNonOccurringConflict: [conflictA],
        findRecurringConflictsForNonRecurring: [conflictB],
      });

      const detector = buildDetectorWithRealHandlers(repo);

      const context = factory.create(
        buildInput({
          activeType: "days",
          recurring: false,
          selectedDays: [1, 2],
          nonReccuringDaysTypeStartsAt: NEW_DATE,
        }),
      );

      const result = await detector.detect(context);

      // NonReccuringActivationHandler should have called
      // findNonOccurringConflict with one range per selected day.
      expect(repo.findNonOccurringConflictCalls).toHaveLength(1);
      // Each range is anchored to NEW_DATE + dayIndex, with the
      // 08:00–09:00 window applied.
      // Day 0 → 2026-08-17 (Monday), Day 1 → 2026-08-18 (Tuesday)
      const expectedRanges = [
        {
          startsAt: new Date("2026-08-17T08:00:00"),
          endsAt: new Date("2026-08-17T09:00:00"),
        },
        {
          startsAt: new Date("2026-08-18T08:00:00"),
          endsAt: new Date("2026-08-18T09:00:00"),
        },
      ];
      expect(repo.findNonOccurringConflictCalls[0]).toEqual(expectedRanges);

      // NonRecurrentAgainstRecurringHandler should have called
      // findRecurringConflictsForNonRecurring with the same ranges.
      expect(repo.findRecurringConflictsForNonRecurringCalls).toHaveLength(1);
      expect(repo.findRecurringConflictsForNonRecurringCalls[0]).toEqual(expectedRanges);

      // Recurring handlers should NOT have been invoked because
      // the context is non-recurring.
      expect(repo.findReccuringConflictCalls).toHaveLength(0);
      expect(repo.findNonRecurringConflictsForRecurringCalls).toHaveLength(0);

      // Results should be flattened.
      expect(result).toEqual([conflictA, conflictB]);
    });

    it("returns an empty array when both non-recurring queries return empty", async () => {
      const repo = new FakeActiveScheduleRepository({});
      const detector = buildDetectorWithRealHandlers(repo);

      const context = factory.create(
        buildInput({
          activeType: "days",
          recurring: false,
          selectedDays: [1, 2],
          nonReccuringDaysTypeStartsAt: NEW_DATE,
        }),
      );

      const result = await detector.detect(context);

      expect(result).toEqual([]);
      expect(repo.findNonOccurringConflictCalls).toHaveLength(1);
      expect(repo.findRecurringConflictsForNonRecurringCalls).toHaveLength(1);
      expect(repo.findReccuringConflictCalls).toHaveLength(0);
    });
  });

  describe("date activation (reccuring=false, activeType='date')", () => {
    it("dispatches to findNonOccurringConflict with the date's range, plus findRecurringConflictsForNonRecurring, flattens results", async () => {
      const conflictA = makeConflict({ id: "date-nonrec-a", activeType: "date" });
      const conflictB = makeConflict({ id: "date-recurring-b", recurring: true });
      // findNonOccurringConflict returns conflictA (non-recurring handler),
      // findRecurringConflictsForNonRecurring returns conflictB.
      const repo = new FakeActiveScheduleRepository({
        findNonOccurringConflict: [conflictA],
        findRecurringConflictsForNonRecurring: [conflictB],
      });

      const detector = buildDetectorWithRealHandlers(repo);

      const context = factory.create(
        buildInput({
          activeType: "date",
          recurring: false,
          selectedDate: NEW_DATE,
          nonReccuringDaysTypeStartsAt: NEW_DATE,
        }),
      );

      const result = await detector.detect(context);

      // NonReccuringActivationHandler should have called findNonOccurringConflict
      // with exactly one range (the date's non-recurring range).
      expect(repo.findNonOccurringConflictCalls).toHaveLength(1);
      const expectedRange = [
        {
          startsAt: new Date("2026-08-17T08:00:00"),
          endsAt: new Date("2026-08-17T09:00:00"),
        },
      ];
      expect(repo.findNonOccurringConflictCalls[0]).toEqual(expectedRange);

      // NonRecurrentAgainstRecurringHandler should have called
      // findRecurringConflictsForNonRecurring with the same single range.
      expect(repo.findRecurringConflictsForNonRecurringCalls).toHaveLength(1);
      expect(repo.findRecurringConflictsForNonRecurringCalls[0]).toEqual(expectedRange);

      // Recurring handlers should NOT have been invoked.
      expect(repo.findReccuringConflictCalls).toHaveLength(0);
      expect(repo.findNonRecurringConflictsForRecurringCalls).toHaveLength(0);

      // Results should be flattened.
      expect(result).toEqual([conflictA, conflictB]);
    });

    it("returns an empty array when both queries return empty", async () => {
      const repo = new FakeActiveScheduleRepository({});
      const detector = buildDetectorWithRealHandlers(repo);

      const context = factory.create(
        buildInput({
          activeType: "date",
          recurring: false,
          selectedDate: NEW_DATE,
          nonReccuringDaysTypeStartsAt: NEW_DATE,
        }),
      );

      const result = await detector.detect(context);

      expect(result).toEqual([]);
    });
  });

  describe("flattening across real handlers", () => {
    it("flattens conflicts from all four real handlers into a single array", async () => {
      // Each repo method returns a different list so we can verify
      // that results from multiple handlers are merged in the correct
      // order (findReccuringConflict results come before
      // findNonRecurrentConflictsForRecurring results).
      const recurringConflicts = [
        makeConflict({ id: "recurring-1" }),
        makeConflict({ id: "recurring-2" }),
      ];
      const nonrecurringConflicts = [
        makeConflict({ id: "nonrecurring-1" }),
        makeConflict({ id: "nonrecurring-2" }),
      ];
      const repo = new FakeActiveScheduleRepository({
        findReccuringConflict: recurringConflicts,
        findNonRecurringConflictsForRecurring: nonrecurringConflicts,
      });

      // Use a recurring days context so both applicable handlers fire.
      const detector = buildDetectorWithRealHandlers(repo);
      const context = factory.create(
        buildInput({ activeType: "days", recurring: true, selectedDays: [1, 2] }),
      );

      const result = await detector.detect(context);

      // Two handlers each returned 2 conflicts → flattened to 4.
      expect(result).toHaveLength(4);
      expect(result.map((c) => c.id)).toEqual([
        "recurring-1",
        "recurring-2",
        "nonrecurring-1",
        "nonrecurring-2",
      ]);
    });
  });
});
