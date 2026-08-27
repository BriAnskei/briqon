import type { Activation } from "@/src/activation/domain/Activation";
import { ConflictDetector } from "@/src/activation/domain/conflict/ConflictDetector";
import type { ConflictHandler } from "@/src/activation/domain/conflict/ConflictHandler";
import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";

/**
 * Hand-rolled fake handler — records every context it was called with and
 * returns a pre-configured list of conflicts. Matches the fakes-over-mocks
 * convention used in AddActivationService.test.ts.
 */
class FakeConflictHandler implements ConflictHandler {
  calls: Activation[] = [];

  constructor(private readonly conflictsToReturn: ScheduleConflict[] = []) {}

  async check(context: Activation): Promise<ScheduleConflict[]> {
    this.calls.push(context);
    return this.conflictsToReturn;
  }
}

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

describe("ConflictDetector", () => {
  // ConflictDetector never inspects the context itself — it only forwards it
  // to each handler — so a plain stand-in is enough here.
  const context = {} as Activation;

  it("calls each handler's check with the given context", async () => {
    const handlerA = new FakeConflictHandler([]);
    const handlerB = new FakeConflictHandler([]);
    const detector = new ConflictDetector([handlerA, handlerB]);

    await detector.detect(context);

    expect(handlerA.calls).toEqual([context]);
    expect(handlerB.calls).toEqual([context]);
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

  it("returns an empty array when no handlers return any conflicts", async () => {
    const handlerA = new FakeConflictHandler([]);
    const handlerB = new FakeConflictHandler([]);
    const detector = new ConflictDetector([handlerA, handlerB]);

    const result = await detector.detect(context);

    expect(result).toEqual([]);
  });

  it("returns an empty array when no handlers are configured", async () => {
    const detector = new ConflictDetector([]);

    const result = await detector.detect(context);

    expect(result).toEqual([]);
  });
});
