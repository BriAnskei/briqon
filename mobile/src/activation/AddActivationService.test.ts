import type { ActivationRepository } from "@/src/activation/ActivationRepository";
import { AddActivationService } from "@/src/activation/AddActivationService";
import type { Activation } from "@/src/activation/domain/Activation";
import { ActivationFactory } from "@/src/activation/domain/ActivationFactory";
import type { ConflictDetector } from "@/src/activation/domain/conflict/ConflictDetector";
import type { ConflictResolver } from "@/src/activation/domain/conflict/ConflictResolver";
import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";
import { ScheduleConflictError } from "@/src/errors/scheduleActivationConflic.error";
import type { ScheduleItem } from "@/type/MessageTypes";
import type { CreateActivationInput } from "@/type/ui/schedule/activation.types";
import type {
  CreateSchedulePayloadType,
  ScheduleService,
} from "../service/schedule.service";

/** Records the context it was asked to detect conflicts for, returns a
 * pre-configured list. */
class FakeConflictDetector {
  calls: Activation[] = [];

  constructor(private readonly conflictsToReturn: ScheduleConflict[] = []) {}

  async detect(context: Activation): Promise<ScheduleConflict[]> {
    this.calls.push(context);
    return this.conflictsToReturn;
  }
}

/** Records every resolve() call — (conflicts, context) pairs. */
class FakeConflictResolver {
  calls: Array<{ conflicts: ScheduleConflict[]; context: Activation }> = [];

  async resolve(conflicts: ScheduleConflict[], context: Activation): Promise<void> {
    this.calls.push({ conflicts, context });
  }
}

/** Records every execute() call. */
class FakeActivationRepository {
  calls: Activation[] = [];

  async execute(payload: Activation): Promise<void> {
    this.calls.push(payload);
  }
}

/** Records exists() and createSchedule() calls. */
class FakeScheduleService {
  existsCalls: string[] = [];
  createScheduleCalls: CreateSchedulePayloadType[] = [];

  constructor(private readonly scheduleExists = false) {}

  async exists(id: string): Promise<boolean> {
    this.existsCalls.push(id);
    return this.scheduleExists;
  }

  async createSchedule(payload: CreateSchedulePayloadType): Promise<void> {
    this.createScheduleCalls.push(payload);
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

function buildInput(overrides: Partial<CreateActivationInput>): CreateActivationInput {
  return {
    scheduleId: "sched-1",
    activeType: "days",
    recurring: true,
    overwrite: false,
    scheduleTimeStart: "08:00",
    sheduleTimeEnd: "09:00",
    selectedDays: [1, 2],
    ...overrides,
  } as CreateActivationInput;
}

describe("AddActivationService", () => {
  const activationFactory = new ActivationFactory();

  function setup(
    conflictsToReturn: ScheduleConflict[] = [],
    options: { scheduleExists?: boolean } = {},
  ) {
    const conflictDetector = new FakeConflictDetector(conflictsToReturn);
    const conflictResolver = new FakeConflictResolver();
    const activationRepository = new FakeActivationRepository();
    const scheduleService = new FakeScheduleService(options.scheduleExists ?? false);
    const service = new AddActivationService(
      conflictDetector as unknown as ConflictDetector,
      conflictResolver as unknown as ConflictResolver,
      activationFactory,
      activationRepository as unknown as ActivationRepository,
      scheduleService as unknown as ScheduleService,
    );
    return {
      conflictDetector,
      conflictResolver,
      activationRepository,
      scheduleService,
      service,
    };
  }

  it("overwrite=false, no conflicts: skips resolve and persists the activation", async () => {
    const { conflictResolver, activationRepository, service } = setup([]);
    const input = buildInput({ overwrite: false });

    await service.add(input);

    expect(conflictResolver.calls).toEqual([]);
    expect(activationRepository.calls).toHaveLength(1);
  });

  it("overwrite=false, conflicts present: throws ScheduleConflictError and never resolves or persists", async () => {
    const conflicts = [makeConflict({ id: "c1" }), makeConflict({ id: "c2" })];
    const { conflictResolver, activationRepository, service } = setup(conflicts);
    const input = buildInput({ overwrite: false });

    await expect(service.add(input)).rejects.toThrow(ScheduleConflictError);

    expect(conflictResolver.calls).toEqual([]);
    expect(activationRepository.calls).toEqual([]);
  });

  it("overwrite=false, single conflict present: still throws (boundary at length===1)", async () => {
    const conflicts = [makeConflict({ id: "c1" })];
    const { conflictResolver, activationRepository, service } = setup(conflicts);
    const input = buildInput({ overwrite: false });

    await expect(service.add(input)).rejects.toThrow(ScheduleConflictError);

    expect(conflictResolver.calls).toEqual([]);
    expect(activationRepository.calls).toEqual([]);
  });

  it("overwrite=false, conflicts present: the thrown error carries the conflict list as context", async () => {
    const conflicts = [makeConflict({ id: "c1" }), makeConflict({ id: "c2" })];
    const { service } = setup(conflicts);
    const input = buildInput({ overwrite: false });

    await expect(service.add(input)).rejects.toMatchObject({
      context: conflicts,
    });
  });

  it("overwrite=true, conflicts present: always calls resolve, then persists", async () => {
    const conflicts = [makeConflict({ id: "c1" })];
    const { conflictDetector, conflictResolver, activationRepository, service } =
      setup(conflicts);
    const input = buildInput({ overwrite: true });

    await service.add(input);

    expect(conflictResolver.calls).toHaveLength(1);
    expect(conflictResolver.calls[0].conflicts).toEqual(conflicts);
    // resolve() must be called with the same context that was detected against.
    expect(conflictResolver.calls[0].context).toBe(conflictDetector.calls[0]);
    expect(activationRepository.calls).toHaveLength(1);
  });

  it("overwrite=true, no conflicts: still calls resolve (no-op) before persisting", async () => {
    const { conflictResolver, activationRepository, service } = setup([]);
    const input = buildInput({ overwrite: true });

    await service.add(input);

    expect(conflictResolver.calls).toHaveLength(1);
    expect(conflictResolver.calls[0].conflicts).toEqual([]);
    expect(activationRepository.calls).toHaveLength(1);
  });

  it("persists the same Activation instance that was built from the input and checked for conflicts", async () => {
    const { conflictDetector, activationRepository, service } = setup([]);
    const input = buildInput({ overwrite: false });

    await service.add(input);

    expect(activationRepository.calls[0]).toBe(conflictDetector.calls[0]);
  });

  // ---------------------------------------------------------------------------
  // Schedule pre-persistence (ensureScheduleSavedAsTemporary)
  //
  // When the input carries scheduleItems the schedule has not yet been saved,
  // so AddActivationService persists it as a temporary row before building the
  // activation aggregate.
  // ---------------------------------------------------------------------------
  describe("scheduleItems pre-persistence", () => {
    const scheduleItems: ScheduleItem[] = [
      { start_time: "08:00", end_time: "09:00", activity: "standup" },
    ];

    it("when scheduleItems provided and schedule does not exist: saves as temporary then persists activation", async () => {
      const { scheduleService, activationRepository, service } = setup([]);
      const input = buildInput({
        scheduleItems,
        summaries: [],
        subSummaries: [],
      });

      await service.add(input);

      // exists() is checked for the scheduleId
      expect(scheduleService.existsCalls).toEqual(["sched-1"]);
      // createSchedule() is called with the temporary schedule
      expect(scheduleService.createScheduleCalls).toHaveLength(1);
      const created = scheduleService.createScheduleCalls[0];
      expect(created.schedule.temporary).toBe(true);
      expect(created.schedule.name).toBe("");
      expect(created.schedule.schedule_list).toBe(scheduleItems);
      // The activation is still persisted
      expect(activationRepository.calls).toHaveLength(1);
    });

    it("when scheduleItems provided and schedule already exists: skips createSchedule", async () => {
      const { scheduleService, activationRepository, service } = setup([], {
        scheduleExists: true,
      });
      const input = buildInput({
        scheduleItems,
        summaries: [],
        subSummaries: [],
      });

      await service.add(input);

      expect(scheduleService.existsCalls).toEqual(["sched-1"]);
      expect(scheduleService.createScheduleCalls).toEqual([]);
      // Activation is still persisted — the schedule already satisfies the FK
      expect(activationRepository.calls).toHaveLength(1);
    });

    it("when scheduleItems not provided: scheduleService is never called", async () => {
      const { scheduleService, service } = setup([]);
      const input = buildInput({ overwrite: false }); // no scheduleItems

      await service.add(input);

      expect(scheduleService.existsCalls).toEqual([]);
      expect(scheduleService.createScheduleCalls).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Activation aggregate correctness by type
  //
  // The AddActivationService builds an Activation aggregate via ActivationFactory
  // and persists it through the repository.  These tests verify that the
  // aggregate carries the correct domain data for each of the three activation
  // shapes:
  //
  //   1. days + recurring    → getDayTypeOccuring()  (occuring time window + days)
  //   2. days + non-recurring → getDayTypeNonOccuring()  (non-recurring ranges per day)
  //   3. date                 → getDateType()  (single date + single non-recurring range)
  //
  // The aggregate is inspected through its public getters — no internal state
  // is poked at directly.
  // ---------------------------------------------------------------------------
  describe("activation aggregate correctness by type", () => {
    const startTime = "08:00";
    const endTime = "09:00";
    // 08:00 → 480 minutes from midnight, 09:00 → 540 minutes.

    it("days + recurring → getDayTypeOccuring returns correct days and occuring time window", async () => {
      const { activationRepository, service } = setup([]);
      const input = buildInput({
        activeType: "days",
        recurring: true,
        selectedDays: [1, 2],
        scheduleTimeStart: startTime,
        sheduleTimeEnd: endTime,
      });

      await service.add(input);

      const activation = activationRepository.calls[0];

      // Core flags
      expect(activation.activeType).toBe("days");
      expect(activation.reccuring).toBe(true);

      // Days array should reflect the selected weekdays.
      expect(activation.getSelectedDaysArr()).toEqual([1, 2]);

      // getDayTypeOccuring produces a DayTypeOccuringActivation payload
      // containing the day entities and a single occuring time window.
      const occuring = activation.getDayTypeOccuring();
      expect(occuring.days.map((d) => d.weekday)).toEqual([1, 2]);
      expect(occuring.occuringTimeWindow.windowStartMin).toBe(480); // 08:00
      expect(occuring.occuringTimeWindow.windowEndMin).toBe(540); // 09:00
    });

    it("days + non-recurring → getDayTypeNonOccuring returns correct ranges, one per selected day", async () => {
      // A fixed start date so the day-offset arithmetic is deterministic.
      const startDate = new Date("2026-08-17T00:00:00"); // Monday (weekday 1)
      const { activationRepository, service } = setup([]);
      const input = buildInput({
        activeType: "days",
        recurring: false,
        selectedDays: [1, 2],
        scheduleTimeStart: startTime,
        sheduleTimeEnd: endTime,
        nonReccuringDaysTypeStartsAt: startDate,
      });

      await service.add(input);

      const activation = activationRepository.calls[0];

      // Core flags
      expect(activation.activeType).toBe("days");
      expect(activation.reccuring).toBe(false);

      // Days array should still reflect the weekdays.
      expect(activation.getSelectedDaysArr()).toEqual([1, 2]);

      // getDayTypeNonOccuring produces a DayTypeNonOccuringActivation payload
      // containing the day entities and one NonOccuringWindowRange per day.
      const nonOccuring = activation.getDayTypeNonOccuring();
      expect(nonOccuring.days.map((d) => d.weekday)).toEqual([1, 2]);
      expect(nonOccuring.ranges).toHaveLength(2);

      // Each range is anchored to startDate + dayIndex (0-based), with the
      // time window (08:00–09:00) applied on that date.
      const expectedStarts = [
        new Date("2026-08-17T08:00:00"), // startDate + 0 days
        new Date("2026-08-18T08:00:00"), // startDate + 1 day
      ];
      const expectedEnds = [
        new Date("2026-08-17T09:00:00"),
        new Date("2026-08-18T09:00:00"),
      ];

      nonOccuring.ranges.forEach((range, i) => {
        expect(range.startsAt).toEqual(expectedStarts[i]);
        expect(range.endsAt).toEqual(expectedEnds[i]);
      });
    });

    it("date → getDateType returns correct date entity and non-occuring range", async () => {
      const selectedDate = new Date("2026-08-20T00:00:00"); // Thursday (weekday 4)
      const startDate = new Date("2026-08-17T00:00:00"); // Monday, used as range anchor
      const { activationRepository, service } = setup([]);
      const input = buildInput({
        activeType: "date",
        selectedDate,
        scheduleTimeStart: startTime,
        sheduleTimeEnd: endTime,
        nonReccuringDaysTypeStartsAt: startDate,
        // selectedDays is irrelevant for date type — factory ignores it.
      });

      await service.add(input);

      const activation = activationRepository.calls[0];

      // Core flags
      expect(activation.activeType).toBe("date");

      // getSelectedDateWeekNumber returns the weekday of the selected date.
      expect(activation.getSelectedDateWeekNumber()).toBe(selectedDate.getDay());

      // getDateType produces a DateTypeActivation payload containing the
      // ActiveScheduleDate entity and a single NonOccuringWindowRange.
      const dateType = activation.getDateType();
      expect(dateType.date.date).toEqual(selectedDate);

      // The range is anchored to startDate (dayIndex = 0 for date type),
      // with the time window applied.
      expect(dateType.range.startsAt).toEqual(new Date("2026-08-17T08:00:00"));
      expect(dateType.range.endsAt).toEqual(new Date("2026-08-17T09:00:00"));
    });
  });
});
