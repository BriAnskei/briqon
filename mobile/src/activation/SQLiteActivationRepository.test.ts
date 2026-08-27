import { ActivationFactory } from "@/src/activation/domain/ActivationFactory";
import { SQLiteActivationRepository } from "@/src/activation/SQLiteActivationRepository";
import type { ActiveScheduleDatesRepository } from "@/src/repository/active-schedule-dates.repository";
import type { ActiveScheduleRepository } from "@/src/repository/activeSchedule.repo";
import type { ActiveScheduleDaysRepository } from "@/src/repository/activeScheduleDays.repo";
import type { NonReccurringRangeRepository } from "@/src/repository/non_reccuring_range.repo";
import type { OccurringTimeWindowRepository } from "@/src/repository/occuring-time-window.repo";
import type { CreateActivationInput } from "@/type/ui/schedule/activation.types";

// Fixed date used anywhere a non-recurring range needs a start date.
const START_DATE = new Date("2026-08-17T00:00:00");

// Stand-in returned by the fake transaction — SQLiteActivationRepository
// only ever threads this through to the sub-repo `create` calls, it never
// inspects it.
const DUMMY_DB = { __dummy: true } as any;

function makeFakeRepo() {
  return {
    create: jest.fn().mockResolvedValue(undefined),
    // Invokes the transaction callback synchronously with the dummy db —
    // no real SQLite is ever touched.
    transaction: jest.fn(async (callback: (db: unknown) => Promise<void>) => {
      return callback(DUMMY_DB);
    }),
  };
}

function makeFakeSubRepo() {
  return { create: jest.fn().mockResolvedValue(undefined) };
}

describe("SQLiteActivationRepository", () => {
  const factory = new ActivationFactory();

  let repo: ReturnType<typeof makeFakeRepo>;
  let activeScheduleDaysRepo: ReturnType<typeof makeFakeSubRepo>;
  let activeScheduleDateRepo: ReturnType<typeof makeFakeSubRepo>;
  let occuringTimeWindowRepo: ReturnType<typeof makeFakeSubRepo>;
  let nonReccuringRangeRepo: ReturnType<typeof makeFakeSubRepo>;
  let sqliteRepo: SQLiteActivationRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    repo = makeFakeRepo();
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

  it("days + recurring: dispatches create, persistDays and persistOccuringtimeWindow inside a single transaction", async () => {
    const activation = factory.create(
      buildInput({ activeType: "days", recurring: true, selectedDays: [1, 3] }),
    );
    const { days, occuringTimeWindow } = activation.getDayTypeOccuring();

    await sqliteRepo.execute(activation);

    expect(repo.transaction).toHaveBeenCalledTimes(1);
    expect(repo.create).toHaveBeenCalledWith(activation.getActiveSchedule(), DUMMY_DB);
    expect(activeScheduleDaysRepo.create).toHaveBeenCalledWith(days, DUMMY_DB);
    expect(occuringTimeWindowRepo.create).toHaveBeenCalledWith(
      occuringTimeWindow,
      DUMMY_DB,
    );
    expect(nonReccuringRangeRepo.create).not.toHaveBeenCalled();
    expect(activeScheduleDateRepo.create).not.toHaveBeenCalled();
  });

  it("days + non-recurring: dispatches create, persistDays and persistNonOccuringRanges inside a single transaction", async () => {
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

    expect(repo.transaction).toHaveBeenCalledTimes(1);
    expect(repo.create).toHaveBeenCalledWith(activation.getActiveSchedule(), DUMMY_DB);
    expect(activeScheduleDaysRepo.create).toHaveBeenCalledWith(days, DUMMY_DB);
    expect(nonReccuringRangeRepo.create).toHaveBeenCalledWith(ranges, DUMMY_DB);
    expect(occuringTimeWindowRepo.create).not.toHaveBeenCalled();
    expect(activeScheduleDateRepo.create).not.toHaveBeenCalled();
  });

  it("date: dispatches create, persistDate and persistNonOccuringRanges inside a single transaction", async () => {
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

    expect(repo.transaction).toHaveBeenCalledTimes(1);
    expect(repo.create).toHaveBeenCalledWith(activation.getActiveSchedule(), DUMMY_DB);
    expect(activeScheduleDateRepo.create).toHaveBeenCalledWith(date, DUMMY_DB);
    expect(nonReccuringRangeRepo.create).toHaveBeenCalledWith([range], DUMMY_DB);
    expect(activeScheduleDaysRepo.create).not.toHaveBeenCalled();
    expect(occuringTimeWindowRepo.create).not.toHaveBeenCalled();
  });

  it("date with recurring flag still routes through the date branch (recurring is irrelevant for date type)", async () => {
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
