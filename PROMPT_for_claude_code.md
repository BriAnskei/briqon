# Claude Code Prompt — Unit Tests for AddActivation Domain (Conflict Detector, Resolver, Persistence)

## Objective

Write **Jest unit tests** for the three core collaborators of the `AddActivationService` flow:

1. **ConflictDetector** (`ConflictDetector.ts`) — verifies it delegates to its handlers and flattens results.
2. **ConflictResolver** (`ConflictResolver.ts`) — verifies every resolution case described in the
   "Conflict Resolution Flow" below, including the "when is resolve needed" decision tree.
3. **SQLiteActivationRepository** (`SQLiteActivationRepository.ts`) — verifies that the correct
   sub-repo `create` calls are dispatched inside a single transaction, for every combination of
   `activeType` × `recurring`.

Use **in-memory fake doubles** (not `jest.mock`) for repository collaborators — this matches the
style already used in `AddActivationService.test.ts`, which injects hand-rolled fakes.  For the
SQLiteActivationRepository test, construct the repository with fake sub-repos that record calls.

---

## Conflict Resolution Flow — the cases to test

### When the NEW activation is NON-recurring (`context.reccuring === false`)

`resolveForNonOccuringActivation` iterates every detected conflict and:

| Case | New activation | Existing conflict | Action |
|------|---------------|-------------------|--------|
| **1** | Date | Days, non-recurring | `removeActiveScheduleDays(conflictId, [weekday of new date])` |
| **2** | Date | Date | `delete(conflictId)` — entire existing activation removed |
| **3** | Any non-recurring | Recurring | **Skipped** — non-recurring is "stronger", overwrites recurring |
| **4** | Days, non-recurring | Date | `delete(conflictId)` |
| **5** | Days, non-recurring | Days, non-recurring (partial overlap) | `removeActiveScheduleDays(conflictId, newActivationDays)` |
| **5b** | Days, non-recurring | Days, non-recurring (full overlap) | `delete(conflictId)` — when every day of existing conflicts |

#### Decision tree ("when is resolve needed"):

- If `overwrite === false` and `conflicts.length > 0` → **throw** `ScheduleConflictError`, do NOT resolve, do NOT persist.
- If `overwrite === false` and `conflicts.length === 0` → **skip** resolve, persist.
- If `overwrite === true` → **always call** `resolve` (even with empty list; resolver is a no-op on empty), then persist.

### When the NEW activation is RECURRING (`context.reccuring === true`)

`resolveOccurringActivation` iterates every detected conflict and:

| Case | New activation | Existing conflict | Action |
|------|---------------|-------------------|--------|
| **A** | Recurring | Recurring (partial overlap) | `removeActiveScheduleDays(conflictId, newActivationDays)` |
| **B** | Recurring | Recurring (full overlap) | `delete(conflictId)` |
| **C** | Recurring | Non-recurring | **Skipped** — non-recurring existing is "stronger" |

---

## File reading order for Claude Code

Read these files **in this order** so you understand the domain from the inside out:

### 1. Core domain classes

| # | File | Why |
|---|------|-----|
| 1 | `mobile/src/activation/domain/Activation.ts` | The aggregate root; has `reccuring`, `activeType`, getters for days/date/ranges |
| 2 | `mobile/src/activation/domain/ActivationFactory.ts` | How `CreateActivationInput` → `Activation` happens; needed to build test contexts |
| 3 | `mobile/src/activation/domain/conflict/ConflictDetector.ts` | Delegates to handlers, flattens results |
| 4 | `mobile/src/activation/domain/conflict/ConflictHandler.ts` | Interface: `check(context): Promise<ScheduleConflict[]>` |
| 5 | `mobile/src/activation/domain/conflict/NonReccuringActivationHandler.ts` | Calls `findNonOccurringConflict` for non-recurring inputs |
| 6 | `mobile/src/activation/domain/conflict/ReccuringActivationHandler.ts` | Calls `findReccuringConflict` for recurring inputs |

### 2. Conflict resolver (the most important file)

| # | File | Why |
|---|------|-----|
| 7 | `mobile/src/activation/domain/conflict/ConflictResolver.ts` | The resolver with `resolveForNonOccuringActivation` and `resolveOccurringActivation` — this is the **primary** file under test |
| 8 | `mobile/src/activation/types/conflictHandler/RecurringAgainstNonRecurringHandler.ts` | One of the 4 detector handlers |
| 9 | `mobile/src/activation/types/conflictHandler/NonRecurringAgainstRecurringHandler.ts` | Another of the 4 detector handlers |

### 3. Persistence layer

| # | File | Why |
|---|------|-----|
| 10 | `mobile/src/activation/SQLiteActivationRepository.ts` | Dispatches creates to sub-repos inside a transaction |
| 11 | `mobile/src/activation/ActivationRepository.ts` | Interface: `execute(payload: Activation)` |
| 12 | `mobile/src/repository/base.repository.ts` | Has `transaction`, `run`, `all`, `first` |
| 13 | `mobile/src/repository/activeSchedule.repo.ts` | Has `delete`, `removeActiveScheduleDays` (via days repo), conflict-finding SQL queries |
| 14 | `mobile/src/repository/activeScheduleDays.repo.ts` | Has `removeActiveScheduleDays(activeScheduleId, weekdays)` |
| 15 | `mobile/src/repository/active-schedule-dates.repository.ts` | Date sub-repo `create` |
| 16 | `mobile/src/repository/occuring-time-window.repo.ts` | Occurring time window sub-repo `create` |
| 17 | `mobile/src/repository/non_reccuring_range.repo.ts` | Non-recurring range sub-repo `create` |

### 4. Entities and types

| # | File | Why |
|---|------|-----|
| 18 | `mobile/src/activation/domain/entity/ActiveScheduleDays.ts` | `weekday` entity |
| 19 | `mobile/src/activation/domain/entity/ActiveScheduleDate.ts` | `date` entity |
| 20 | `mobile/src/activation/domain/entity/OccurinngTimeWindow.ts` | `windowStartMin`, `windowEndMin` entity |
| 21 | `mobile/src/activation/domain/entity/NonOccuringWindowRange.ts` | `startsAt`, `endsAt` entity |
| 22 | `mobile/src/activation/types/ActiveType.ts` | `"days" \| "date"` |
| 23 | `mobile/src/activation/types/CreateActivationData.ts` | `CreateActivationData` interface |
| 24 | `mobile/src/activation/types/CreateActiveScheduleInput.ts` | `CreateActiveScheduleInput` interface |
| 25 | `mobile/src/activation/types/CreateActiveScheduleDaysInput.ts` | `CreateActiveScheduleDaysInput` interface |
| 26 | `mobile/src/activation/types/payloads/DayTypeOccuringActivation.ts` | `DayTypeOccuringActivation` payload type |
| 27 | `mobile/src/activation/types/payloads/DayTypeNonOccuringActivation.ts` | `DayTypeNonOccuringActivation` payload type |
| 28 | `mobile/src/activation/types/payloads/DateTypeActivation.ts` | `DateTypeActivation` payload type |
| 29 | `mobile/src/activation/types/conflictHandler/FindNonOccuringActivationConflictInput.ts` | `{ startsAt, endsAt }` input type |
| 30 | `mobile/src/activation/types/conflictHandler/FindReccuringActivationConflictInput.ts` | `{ weekDays, windowStartMin, windowEndMin }` input type |

### 5. Errors and models

| # | File | Why |
|---|------|-----|
| 31 | `mobile/src/errors/scheduleActivationConflic.error.ts` | `ScheduleConflict` type + `ScheduleConflictError` |
| 32 | `mobile/src/errors/business.error.ts` | `BaseError<T>` base class |
| 33 | `mobile/src/models/activeSchedule.model.ts` | `ActiveSchedule` zod schema + type |

### 6. Orchestration and composition (context)

| # | File | Why |
|---|------|-----|
| 34 | `mobile/src/activation/AddActivationService.ts` | The orchestrator that calls detector → resolver → repository |
| 35 | `mobile/src/composition/activationServiceComposition.ts` | Wire-up: which handlers, which repos |

### 7. Existing test files (for conventions)

| # | File | Why |
|---|------|-----|
| 36 | `mobile/src/activation/AddActivationService.test.ts` | **Primary reference** — uses hand-rolled fakes, real `ActivationFactory`, `@/` alias imports |
| 37 | `mobile/src/service/active-schedule.service.test.ts` | Uses `jest.mock` pattern; also shows conflict error inspection |

### 8. Supporting utilities

| # | File | Why |
|---|------|-----|
| 38 | `mobile/utils/TimeFormatter.ts` | `createWindowMinutesFromTime`, `createTimeRange`, `addDays`, `getMinutesOfDay` — used by entities |

### 9. Jest config

| # | File | Why |
|---|------|-----|
| 39 | `mobile/jest.config.js` | Uses `jest-expo` preset, `@/` alias, setupFilesAfterEnv |

---

## What to produce

Create **three test files** (plus any shared test helpers in a `__fixtures__` or inline):

1. **`mobile/src/activation/domain/conflict/ConflictDetector.test.ts`**
   - Test that it calls each handler's `check` with the context.
   - Test that it flattens results from multiple handlers.
   - Test that it returns an empty array when no handlers return conflicts.
   - Test that it returns an empty array when no handlers are configured.

2. **`mobile/src/activation/domain/conflict/ConflictResolver.test.ts`**
   - **Non-recurring branch** (`resolveForNonOccuringActivation`):
     - Case 1: Date(new) vs Days non-recurring → calls `removeActiveScheduleDays` with weekday of new date.
     - Case 2: Date(new) vs Date → calls `delete` on conflictId.
     - Case 3: Any non-recurring vs Recurring → skipped (neither `delete` nor `removeActiveScheduleDays` called).
     - Case 4: Days non-recurring(new) vs Date → calls `delete`.
     - Case 5: Days non-recurring(new) vs Days non-recurring, partial → calls `removeActiveScheduleDays`.
     - Case 5b: Days non-recurring(new) vs Days non-recurring, full overlap → calls `delete`.
   - **Recurring branch** (`resolveOccurringActivation`):
     - Case A: Recurring(new) vs Recurring, partial → `removeActiveScheduleDays`.
     - Case B: Recurring(new) vs Recurring, full overlap → `delete`.
     - Case C: Recurring(new) vs Non-recurring → skipped.
   - Use fake `ActiveScheduleRepository` and `ActiveScheduleDaysRepository` that record calls.

3. **`mobile/src/activation/SQLiteActivationRepository.test.ts`**
   - Mock all 5 sub-repos as fakes that record calls and return resolved values.
   - Mock the `repo.transaction` to invoke the callback synchronously with a dummy `db`.
   - Test all three branches:
     - `days` + `recurring === true` → `repo.create` + `persistDays` + `persistOccuringtimeWindow`
     - `days` + `recurring === false` → `repo.create` + `persistDays` + `persistNonOccuringRanges`
     - `date` → `repo.create` + `persistDate` + `persistNonOccuringRanges`
   - Verify `transaction` is called exactly once per `execute`.

---

## Test authoring conventions (match existing patterns)

- **Import alias**: use `@/…` for imports (e.g. `import { ActivationFactory } from "@/src/activation/domain/ActivationFactory"`).
- **Test framework**: Jest with `jest-expo` preset. Use `describe` / `it` / `expect` / `beforeEach`.
- **Fakes over mocks**: prefer hand-rolled in-memory fakes (like `AddActivationService.test.ts` does) over `jest.mock(...)`.  Fakes record calls on a plain property and return configurable values.
- **No real DB**: `SQLiteActivationRepository` tests must mock `BaseRepository.transaction` or inject fakes so no SQLite is touched.
- **`jest.clearAllMocks()` in `beforeEach`** when using `jest.fn()`.
- **Time constants**: use fixed dates like `new Date("2026-08-17T00:00:00")` (Sunday) for deterministic weekday calculations.
- **Comment density**: match the existing test style — descriptive `it("...") ` names and inline comments explaining the scenario.

---

## Key API surface to reference while writing

### `Activation` (from `Activation.ts`)

| Property / Method | Type | Notes |
|---|---|---|
| `id` | `string` | ULID, generated in constructor |
| `scheduleId` | `string` | From `CreateActivationData` |
| `activeType` | `"days" \| "date"` | From `CreateActivationData` |
| `reccuring` | `boolean` | From `CreateActivationData` |
| `getSelectedDaysArr()` | `number[]` | Weekday numbers (0=Sun … 6=Sat) |
| `getSelectedDateWeekNumber()` | `number` | Weekday of date-type selection |
| `getDayTypeOccuring()` | `DayTypeOccuringActivation` | For recurring days |
| `getDayTypeNonOccuring()` | `DayTypeNonOccuringActivation` | For non-recurring days |
| `getDateType()` | `DateTypeActivation` | For date type |

### `ConflictResolver.resolve(conflicts, context)`

| Branch | Condition | Conflict filter | Resolve helper |
|---|---|---|---|
| `resolveOccurringActivation` | `context.reccuring === true` | only `conflict.recurring === true` | `resolveDay` |
| `resolveForNonOccuringActivation` | `context.reccuring === false` | only `conflict.recurring === false` | `resolveDay` or `delete` |

### `resolveDay(conflict, newActivationDays)`

- Computes `remainingDays = existingDays.filter(d ⇒ !newActivationDays.includes(d))`
- If `remainingDays.length === 0` → `activeScheduleRepository.delete(conflict.id)`
- Else → `activeScheduleDaysRepository.removeActiveScheduleDays(conflict.id, newActivationDays)`

### `ScheduleConflict` shape

```ts
{
  id: string;            // active schedule id
  scheduleName: string;
  scheduleId: string;
  activeType: "days" | "date";
  recurring: boolean;
  nonOccuring?: { selectedDays?: number[]; selectedDate?: string; ranges: Array<{ dayNumber, startsAt: Date, endsAt: Date }> };
  occuring?: { selectedDays: number[]; windowStartMin: number; windowEndMin: number };
}
```

### `CreateActivationInput` shape

```ts
{
  scheduleId: string;
  activeType: "days" | "date";
  recurring: boolean;
  selectedDays?: number[];
  selectedDate?: Date;
  overwrite: boolean;
  nonReccuringDaysTypeStartsAt?: Date;
  scheduleTimeStart: string;   // "HH:MM"
  sheduleTimeEnd: string;      // "HH:MM" (note the typo — kept from source)
  scheduleItems?: ScheduleItem[];
  summaries?: ScheduleSummary[];
  subSummaries?: SubSummary[];
}
```

---

## Verification

After writing tests, run:

```bash
npx jest --config mobile/jest.config.js --testPathPattern="activation" --no-coverage
```

All tests must pass.  If any test fails, fix the **test** (not the source code) until green.
