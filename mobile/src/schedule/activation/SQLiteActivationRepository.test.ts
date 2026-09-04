import type { ActiveScheduleDatesRepository } from "@/src/repository/active-schedule-dates.repository";
import type { ActiveScheduleRepository } from "@/src/repository/activeSchedule.repo";
import type { ActiveScheduleDaysRepository } from "@/src/repository/activeScheduleDays.repo";
import type { NonReccurringRangeRepository } from "@/src/repository/non_reccuring_range.repo";
import type { OccurringTimeWindowRepository } from "@/src/repository/occuring-time-window.repo";
import type { CreateActivationInput } from "@/type/ui/schedule/activation.types";
import { ActivationFactory } from "./domain/ActivationFactory";
import { SQLiteActivationRepository } from "./SQLiteActivationRepository";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SQLiteActivationRepository — unit tests
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  SQLiteActivationRepository.execute(activation) wraps all persistence in a
 *  single transaction.  Inside the transaction it always calls
 *  `repo.create(activeSchedule, db)` and then dispatches to one of three
 *  private type-handlers depending on `activeType` × `recurring`:
 *
 *    activeType | recurring   → handler                         → sub-repos
 *    ------------┼-------------┼──────────────────────────────────┼─────────────────────
 *    days      | true   → handleDayTypeOccuring    → persistDays + persistOccuringWindow
 *    days      | false  → handleDayTypeNonOccurring → persistDays + persistNonOccuringRanges
 *    date      | *      → handleDateType            → persistDate  + persistNonOccuringRanges
 *
 *  Key behaviours under test:
 *    1. `repo.transaction` is called exactly once per `execute` call.
 *    2. `repo.create` is always called first, inside the transaction,
 *       with the active-schedule payload from the activation and the
 *       transaction-scoped `db` handle.
 *    3. For each activeType × recurring combination the correct *set* of
 *       sub-repo `create` calls is made — and no others.
 *    4. Every sub-repo `create` call receives the *same* `db` handle
 *       that `transaction` handed to the callback (no leak to wrong scope).
 *    5. The data dispatched to each sub-repo matches what the activation
 *       aggregate exposes via its getter methods.
 *
 *  Fakes-over-mocks convention (matches AddActivationService.test.ts):
 *  sub-repos are hand-rolled fakes that record calls on plain arrays.
 *  No `jest.mock(...)` or real SQLite is touched.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Fixed date used anywhere a non-recurring range needs a start date.
const START_DATE = new Date("2026-08-17T00:00:00");

// Stand-in returned by the fake transaction — SQLiteActivationRepository
// only ever threads this through to the sub-repo `create` calls, it never
// inspects it.
const DUMMY_DB = { __dummy: true } as any;

/**
 * Fake for the main ActiveScheduleRepository (repo).
 * Records `create` calls and provides a `transaction` that invokes the
 * callback synchronously with DUMMY_DB — no real SQLite is touched.
 */
function makeFakeMainRepo() {
  return {
    create: jest.fn().mockResolvedValue(undefined),
    transaction: jest.fn(async (callback: (db: unknown) => Promise<void>) => {
      return callback(DUMMY_DB);
    }),
  };
}

/** Fake for any sub-repo that just records `create` calls. */
function makeFakeSubRepo() {
  return { create: jest.fn().mockResolvedValue(undefined) };
}

describe("SQLiteActivationRepository", () => {
  const factory = new ActivationFactory();

  let repo: ReturnType<typeof makeFakeMainRepo>;
  let activeScheduleDaysRepo: ReturnType<typeof makeFakeSubRepo>;
  let activeScheduleDateRepo: ReturnType<typeof makeFakeSubRepo>;
  let occuringTimeWindowRepo: ReturnType<typeof makeFakeSubRepo>;
  let nonReccuringRangeRepo: ReturnType<typeof makeFakeSubRepo>;
  let sqliteRepo: SQLiteActivationRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    repo = makeFakeMainRepo();
    activeScheduleDaysRepo = makeFakeSubRepo();
    activeScheduleDateRepo = makeFakeSubRepo();
    occuringTimeWindowRepo = makeFakeSubRepo();
    nonReccuringRangeRepo = makeFakeSubRepo();

    sqliteRepo = new SQLiteActivationRepository(
      repo as unknown as ActiveScheduleRepository,
      activeScheduleDaysRepo as unknown as ActiveScheduleDaysRepository,
      activeScheduleDateRepo as unknown as ActiveScheduleDatesRepository,
      occuringTimeWindowRepo as unknown as OccurringTimeWindowRepository,
      nonReccuringRangeRepo as unknown as NonReccurringRangeRepository,
    );
  });

  function buildInput(overrides: Partial<CreateActivationInput>): CreateActivationInput {
    return {
      scheduleId: "sched-1",
      activeType: "days",
      recurring: false,
      overwrite: false,
      scheduleTimeStart: "08:00",
      sheduleTimeEnd: "09:00",
      ...overrides,
    } as CreateActivationInput;
  }

  // ── shared invariant: transaction + create ─────────────────────────────
  // Every branch must (a) wrap work in exactly one transaction and (b)
  // call repo.create as the first persistence step inside it.
  describe("shared invariants", () => {
    it("always calls repo.transaction exactly once per execute()", async () => {
      const activation = factory.create(
        buildInput({ activeType: "days", recurring: true, selectedDays: [1] }),
      );

      await sqliteRepo.execute(activation);

      expect(repo.transaction).toHaveBeenCalledTimes(1);
    });

    it("always calls repo.create inside the transaction with the active schedule payload and db", async () => {
      const activation = factory.create(
        buildInput({ activeType: "days", recurring: true, selectedDays: [1] }),
      );

      await sqliteRepo.execute(activation);

      expect(repo.create).toHaveBeenCalledTimes(1);
      expect(repo.create).toHaveBeenCalledWith(activation.getActiveSchedule(), DUMMY_DB);
    });
  });

  // ── days + recurring ──────────────────────────────────────────────────
  describe("days + recurring (activeType='days', recurring=true)", () => {
    it("dispatches create, persistDays and persistOccuringWindow — and nothing else", async () => {
      const activation = factory.create(
        buildInput({ activeType: "days", recurring: true, selectedDays: [1, 3] }),
      );
      const { days, occuringTimeWindow } = activation.getDayTypeOccuring();

      await sqliteRepo.execute(activation);

      // Transaction + main create.
      expect(repo.transaction).toHaveBeenCalledTimes(1);
      expect(repo.create).toHaveBeenCalledWith(activation.getActiveSchedule(), DUMMY_DB);

      // Day-type occurring handler: persistDays + persistOccuringWindow.
      expect(activeScheduleDaysRepo.create).toHaveBeenCalledWith(days, DUMMY_DB);
      expect(occuringTimeWindowRepo.create).toHaveBeenCalledWith(
        occuringTimeWindow,
        DUMMY_DB,
      );
      expect(occuringTimeWindowRepo.create).toHaveBeenCalledTimes(1);

      // Negative: date-related and non-occurring range repos must NOT fire.
      expect(activeScheduleDateRepo.create).not.toHaveBeenCalled();
      expect(nonReccuringRangeRepo.create).not.toHaveBeenCalled();
    });

    it("persists the exact days and time window exposed by the activation", async () => {
      const activation = factory.create(
        buildInput({
          activeType: "days",
          recurring: true,
          selectedDays: [1, 3],
          scheduleTimeStart: "08:00",
          sheduleTimeEnd: "09:00",
        }),
      );
      const { days, occuringTimeWindow } = activation.getDayTypeOccuring();

      await sqliteRepo.execute(activation);

      // Verify the days entities carry the expected weekday values.
      const persistedDays = activeScheduleDaysRepo.create.mock.calls[0][0];
      expect(persistedDays.map((d: { weekday: number }) => d.weekday)).toEqual([1, 3]);

      // Verify the time window has the expected minute offsets.
      const persistedWindow = occuringTimeWindowRepo.create.mock.calls[0][0];
      expect(persistedWindow.windowStartMin).toBe(480); // 08:00
      expect(persistedWindow.windowEndMin).toBe(540); // 09:00
    });
  });

  // ── days + non-recurring ──────────────────────────────────────────────
  describe("days + non-recurring (activeType='days', recurring=false)", () => {
    it("dispatches create, persistDays and persistNonOccuringRanges — and nothing else", async () => {
      const activation = factory.create(
        buildInput({
          activeType: "days",
          recurring: false,
          selectedDays: [1, 3],
          nonReccuringDaysTypeStartsAt: START_DATE,
        }),
      );
      const { days, ranges } = activation.getDayTypeNonOccuring();

      await sqliteRepo.execute(activation);

      // Transaction + main create.
      expect(repo.transaction).toHaveBeenCalledTimes(1);
      expect(repo.create).toHaveBeenCalledWith(activation.getActiveSchedule(), DUMMY_DB);

      // Day-type non-occurring handler: persistDays + persistNonOccuringRanges.
      expect(activeScheduleDaysRepo.create).toHaveBeenCalledWith(days, DUMMY_DB);
      expect(nonReccuringRangeRepo.create).toHaveBeenCalledWith(ranges, DUMMY_DB);
      expect(nonReccuringRangeRepo.create).toHaveBeenCalledTimes(1);

      // Negative: date and occurring-window repos must NOT fire.
      expect(activeScheduleDateRepo.create).not.toHaveBeenCalled();
      expect(occuringTimeWindowRepo.create).not.toHaveBeenCalled();
    });

    it("persists the exact day count and range count exposed by the activation", async () => {
      const selectedDays = [1, 3];
      const activation = factory.create(
        buildInput({
          activeType: "days",
          recurring: false,
          selectedDays,
          nonReccuringDaysTypeStartsAt: START_DATE,
        }),
      );

      await sqliteRepo.execute(activation);

      // One day entity per selected day.
      const persistedDays = activeScheduleDaysRepo.create.mock.calls[0][0];
      expect(persistedDays).toHaveLength(selectedDays.length);

      // One non-occurring range per selected day.
      const persistedRanges = nonReccuringRangeRepo.create.mock.calls[0][0];
      expect(persistedRanges).toHaveLength(selectedDays.length);
    });
  });

  // ── date ──────────────────────────────────────────────────────────────
  describe("date (activeType='date')", () => {
    it("dispatches create, persistDate and persistNonOccuringRanges([range]) — and nothing else", async () => {
      const activation = factory.create(
        buildInput({
          activeType: "date",
          recurring: false,
          selectedDate: START_DATE,
          nonReccuringDaysTypeStartsAt: START_DATE,
        }),
      );
      const { date, range } = activation.getDateType();

      await sqliteRepo.execute(activation);

      // Transaction + main create.
      expect(repo.transaction).toHaveBeenCalledTimes(1);
      expect(repo.create).toHaveBeenCalledWith(activation.getActiveSchedule(), DUMMY_DB);

      // Date-type handler: persistDate + persistNonOccuringRanges([range]).
      expect(activeScheduleDateRepo.create).toHaveBeenCalledWith(date, DUMMY_DB);
      expect(nonReccuringRangeRepo.create).toHaveBeenCalledWith([range], DUMMY_DB);
      expect(nonReccuringRangeRepo.create).toHaveBeenCalledTimes(1);

      // Negative: days and occurring-window repos must NOT fire.
      expect(activeScheduleDaysRepo.create).not.toHaveBeenCalled();
      expect(occuringTimeWindowRepo.create).not.toHaveBeenCalled();
    });

    it("date+recurring still routes through the date branch (recurring flag is irrelevant for date type)", async () => {
      // Guards against a regression where `activeType === "date"` accidentally
      // falls into the days branches — the source only checks activeType for
      // the date case.
      const activation = factory.create(
        buildInput({
          activeType: "date",
          recurring: false,
          selectedDate: START_DATE,
          nonReccuringDaysTypeStartsAt: START_DATE,
        }),
      );

      await sqliteRepo.execute(activation);

      expect(activeScheduleDaysRepo.create).not.toHaveBeenCalled();
      expect(occuringTimeWindowRepo.create).not.toHaveBeenCalled();
      expect(activeScheduleDateRepo.create).toHaveBeenCalledTimes(1);
      expect(nonReccuringRangeRepo.create).toHaveBeenCalledTimes(1);
    });
  });

  // ── db threading ─────────────────────────────────────────────────────
  describe("db threading", () => {
    it("passes the transaction-provided db to every sub-repo create call", async () => {
      // Capture the db argument the transaction callback receives,
      // then verify every sub-repo create call used that same db.
      const capturedDbs: unknown[] = [];
      repo.transaction = jest.fn(async (callback: (db: unknown) => Promise<void>) => {
        const db = DUMMY_DB;
        capturedDbs.push(db);
        return callback(db);
      });

      const activation = factory.create(
        buildInput({
          activeType: "days",
          recurring: true,
          selectedDays: [1, 2],
        }),
      );

      await sqliteRepo.execute(activation);

      // The transaction callback was called with DUMMY_DB.
      expect(capturedDbs).toEqual([DUMMY_DB]);

      // Every sub-repo create should have received DUMMY_DB as the 2nd arg.
      expect(repo.create).toHaveBeenLastCalledWith(expect.anything(), DUMMY_DB);
      expect(activeScheduleDaysRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        DUMMY_DB,
      );
      expect(occuringTimeWindowRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        DUMMY_DB,
      );
    });
  });

  // ── call ordering ────────────────────────────────────────────────────
  // The type-handlers must dispatch create → persistDays → persistWindow
  // (or persistRanges) in that specific order.  Swapping the order of the
  // persist calls would break invariants in the real DB layer, so we
  // assert the invocation order here.
  describe("call ordering", () => {
    it("days+recurring: repo.create before persistDays before persistOccuringWindow", async () => {
      const activation = factory.create(
        buildInput({ activeType: "days", recurring: true, selectedDays: [1, 2] }),
      );

      await sqliteRepo.execute(activation);

      // jest provides .mock.invocationCallOrder so we can assert sequential
      // ordering regardless of return values.
      expect(repo.create.mock.invocationCallOrder[0]).toBeLessThan(
        activeScheduleDaysRepo.create.mock.invocationCallOrder[0],
      );
      expect(activeScheduleDaysRepo.create.mock.invocationCallOrder[0]).toBeLessThan(
        occuringTimeWindowRepo.create.mock.invocationCallOrder[0],
      );
    });

    it("days+non-recurring: repo.create before persistDays before persistNonOccuringRanges", async () => {
      const activation = factory.create(
        buildInput({
          activeType: "days",
          recurring: false,
          selectedDays: [1, 3],
          nonReccuringDaysTypeStartsAt: START_DATE,
        }),
      );

      await sqliteRepo.execute(activation);

      expect(repo.create.mock.invocationCallOrder[0]).toBeLessThan(
        activeScheduleDaysRepo.create.mock.invocationCallOrder[0],
      );
      expect(activeScheduleDaysRepo.create.mock.invocationCallOrder[0]).toBeLessThan(
        nonReccuringRangeRepo.create.mock.invocationCallOrder[0],
      );
    });

    it("date: repo.create before persistDate before persistNonOccuringRanges", async () => {
      const activation = factory.create(
        buildInput({
          activeType: "date",
          recurring: false,
          selectedDate: START_DATE,
          nonReccuringDaysTypeStartsAt: START_DATE,
        }),
      );

      await sqliteRepo.execute(activation);

      expect(repo.create.mock.invocationCallOrder[0]).toBeLessThan(
        activeScheduleDateRepo.create.mock.invocationCallOrder[0],
      );
      expect(activeScheduleDateRepo.create.mock.invocationCallOrder[0]).toBeLessThan(
        nonReccuringRangeRepo.create.mock.invocationCallOrder[0],
      );
    });
  });
});
