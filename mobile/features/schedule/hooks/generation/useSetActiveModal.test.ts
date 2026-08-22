import { act, renderHook } from "@testing-library/react-native";
import { useSetActiveModal } from "@/features/schedule/hooks/generation/useSetActiveModal";
import type { ScheduleItem } from "@/src/models/schedule.model";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockCreateAsync = jest.fn().mockResolvedValue(undefined);

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock("@/hooks/useModal", () => ({
  __esModule: true,
  default: () => ({
    isOpen: false,
    open: jest.fn(),
    close: jest.fn(),
    toggle: jest.fn(),
  }),
}));

jest.mock("@/src/composition/activationServiceComposition", () => ({
  activeScheduleService: {
    createAsync: (...args: unknown[]) => mockCreateAsync(...args),
  },
}));

// ── Fixtures ───────────────────────────────────────────────────────────────────

const scheduleItems: ScheduleItem[] = [
  { start_time: "08:00", end_time: "16:00", activity: "Work", enabled: true },
];

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    result: { summary: [], subSummary: [], schedule: scheduleItems },
    generatedScheduleId: "sched-test-001",
    scheduleItems,
    setIsScheduleSavedByActivation: jest.fn(),
    isScheduleSavedByActivation: false,
    isScheduleSavedDirectly: false,
    ...overrides,
  } as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

/**
 * These tests document the payload-building patterns of useSetActiveModal,
 * with a focus on how nonReccuringDaysTypeStartsAt is derived for each mode.
 *
 * Key invariant (non-recurring day type): nonReccuringDaysTypeStartsAt is
 * ALWAYS on a selected weekday — the hook uses resolveRangeStart() to snap
 * the anchor forward to the first matching weekday, and toggleDay() snaps
 * the anchor when the first day is added.
 *
 * Key invariant (recurring day type): nonReccuringDaysTypeStartsAt is
 * undefined — the schedule repeats weekly so no concrete start date is needed.
 */
describe("useSetActiveModal — payload building", () => {
  beforeAll(() => {
    // Aug 18 2026 is a Tuesday.
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-18T06:00:00"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Non-recurring day type (range mode) ─────────────────────────────────────

  describe("non-recurring day type (range mode)", () => {
    it("snaps rangeAnchorDate to the first selected weekday on/after the anchor when the first day is toggled", () => {
      const { result } = renderHook(() => useSetActiveModal(makeProps()));

      act(() => result.current.handleModeSelect("range"));

      // Before toggling: anchor is the initial new Date() → Aug 18 (Tuesday)
      expect(result.current.rangeAnchorDate.getDay()).toBe(2); // Tuesday

      // Toggle Monday — toggleDay snaps the anchor forward to Aug 24,
      // the first Monday on or after Aug 18.
      act(() => result.current.toggleDay("Monday"));
      expect(result.current.rangeAnchorDate.getDay()).toBe(1); // Monday
      expect(result.current.rangeAnchorDate.getDate()).toBe(24);
    });

    it("buildPayload: nonReccuringDaysTypeStartsAt lands on a selected weekday", () => {
      const { result } = renderHook(() => useSetActiveModal(makeProps()));

      act(() => result.current.handleModeSelect("range"));
      act(() => result.current.toggleDay("Monday"));
      act(() => result.current.toggleDay("Wednesday"));
      act(() => result.current.toggleDay("Friday"));

      const payload = result.current.buildPayload();

      // The start date MUST be on a selected weekday (Mon=1, Wed=3, Fri=5).
      const startWeekday = payload.nonReccuringDaysTypeStartsAt!.getDay();
      expect([1, 3, 5]).toContain(startWeekday);

      // Monday was toggled first → anchor snapped to Aug 24 (Monday) → start = Monday
      expect(startWeekday).toBe(1);

      // selectedDays arrives as sorted weekday indices
      expect(payload.selectedDays).toEqual([1, 3, 5]);
      expect(payload.activeType).toBe("days");
      expect(payload.recurring).toBe(false);
      expect(payload.overwrite).toBe(false);
      expect(payload.scheduleTimeStart).toBe("08:00");
      expect(payload.sheduleTimeEnd).toBe("16:00");
      expect(payload.selectedDate).toBeUndefined();

      // Schedule data should be included when the schedule has not yet been
      // persisted (isScheduleNeedsToSave = !isScheduleSavedDirectly && !isScheduleSavedByActivation)
      expect(payload.scheduleItems).toEqual(scheduleItems);
      expect(payload.summaries).toEqual([]);
      expect(payload.subSummaries).toEqual([]);
    });

    it("exposes day-name strings in hook state but weekday indices in the payload", () => {
      const { result } = renderHook(() => useSetActiveModal(makeProps()));

      act(() => result.current.handleModeSelect("range"));
      act(() => result.current.toggleDay("Monday"));
      act(() => result.current.toggleDay("Wednesday"));
      act(() => result.current.toggleDay("Friday"));

      // Hook state holds day-name strings
      expect(result.current.selectedDays).toEqual(["Monday", "Wednesday", "Friday"]);
      // buildPayload converts to sorted weekday indices
      expect(result.current.buildPayload().selectedDays).toEqual([1, 3, 5]);
    });

    it("does NOT call createAsync from buildPayload (only handleConfirm does)", () => {
      const { result } = renderHook(() => useSetActiveModal(makeProps()));

      act(() => result.current.handleModeSelect("range"));
      act(() => result.current.toggleDay("Monday"));

      result.current.buildPayload();

      expect(mockCreateAsync).not.toHaveBeenCalled();
    });
  });

  // ── Recurring day type (range mode) ──────────────────────────────────────────

  describe("recurring day type (range mode)", () => {
    it("buildPayload: omits nonReccuringDaysTypeStartsAt, keeps selectedDays and recurring=true", () => {
      const { result } = renderHook(() => useSetActiveModal(makeProps()));

      act(() => result.current.handleModeSelect("range"));
      act(() => result.current.setRecurring(true));
      act(() => result.current.toggleDay("Monday"));
      act(() => result.current.toggleDay("Wednesday"));

      const payload = result.current.buildPayload();

      expect(payload.recurring).toBe(true);
      expect(payload.nonReccuringDaysTypeStartsAt).toBeUndefined();
      expect(payload.selectedDays).toEqual([1, 3]);
      expect(payload.activeType).toBe("days");
      expect(payload.overwrite).toBe(false);
    });

    it("toggleDay does NOT snap the anchor when recurring is true", () => {
      const { result } = renderHook(() => useSetActiveModal(makeProps()));

      act(() => result.current.handleModeSelect("range"));
      act(() => result.current.setRecurring(true));

      const anchorBefore = result.current.rangeAnchorDate;

      act(() => result.current.toggleDay("Monday"));

      // Anchor should be unchanged — snapping only happens for non-recurring
      expect(result.current.rangeAnchorDate.getTime()).toBe(anchorBefore.getTime());
    });
  });

  // ── Today mode ───────────────────────────────────────────────────────────────

  describe("today mode", () => {
    it("buildPayload: uses today's weekday and startOfDay as nonReccuringDaysTypeStartsAt", () => {
      const { result } = renderHook(() => useSetActiveModal(makeProps()));

      act(() => result.current.handleModeSelect("today"));

      const payload = result.current.buildPayload();

      // Aug 18 2026 is a Tuesday (weekday 2).
      expect(payload.activeType).toBe("days");
      expect(payload.recurring).toBe(false);
      expect(payload.selectedDays).toEqual([2]);
      expect(payload.nonReccuringDaysTypeStartsAt).toEqual(
        new Date("2026-08-18T00:00:00"),
      );
    });
  });

  // ── Tomorrow mode ───────────────────────────────────────────────────────────

  describe("tomorrow mode", () => {
    it("buildPayload: uses tomorrow's weekday and startOfDay as nonReccuringDaysTypeStartsAt", () => {
      const { result } = renderHook(() => useSetActiveModal(makeProps()));

      act(() => result.current.handleModeSelect("tomorrow"));

      const payload = result.current.buildPayload();

      // Aug 18 (Tue) → Aug 19 (Wed)
      expect(payload.activeType).toBe("days");
      expect(payload.recurring).toBe(false);
      expect(payload.selectedDays).toEqual([3]);
      expect(payload.nonReccuringDaysTypeStartsAt).toEqual(
        new Date("2026-08-19T00:00:00"),
      );
    });
  });

  // ── Specific date mode ────────────────────────────────────────────────────────

  describe("specific date mode", () => {
    it("buildPayload: sets activeType=date with selectedDate and nonReccuringDaysTypeStartsAt as startOfDay", () => {
      const { result } = renderHook(() => useSetActiveModal(makeProps()));

      act(() => result.current.handleModeSelect("specific"));
      act(() =>
        result.current.handleDateChange(
          { type: "set" } as any,
          new Date("2026-08-25T12:00:00"), // Monday
        ),
      );

      const payload = result.current.buildPayload();

      expect(payload.activeType).toBe("date");
      expect(payload.recurring).toBe(false);
      expect(payload.selectedDate).toEqual(new Date("2026-08-25T00:00:00"));
      expect(payload.nonReccuringDaysTypeStartsAt).toEqual(
        new Date("2026-08-25T00:00:00"),
      );
    });
  });

  // ── Schedule data payload inclusion ──────────────────────────────

  describe("schedule data in payload", () => {
    it("includes scheduleItems, summaries, and subSummaries when schedule has not been saved", () => {
      const { result } = renderHook(() => useSetActiveModal(makeProps()));

      act(() => result.current.handleModeSelect("range"));
      act(() => result.current.toggleDay("Monday"));

      const payload = result.current.buildPayload();

      // isScheduleNeedsToSave = !isScheduleSavedDirectly && !isScheduleSavedByActivation
      // Both are false by default in makeProps(), so schedule data should be present
      expect(payload.scheduleItems).toEqual(scheduleItems);
      expect(payload.summaries).toEqual([]);
      expect(payload.subSummaries).toEqual([]);
    });

    it("omits scheduleItems when isScheduleSavedDirectly is true", () => {
      const { result } = renderHook(() =>
        useSetActiveModal(
          makeProps({
            isScheduleSavedDirectly: true,
          }),
        ),
      );

      act(() => result.current.handleModeSelect("range"));
      act(() => result.current.toggleDay("Monday"));

      const payload = result.current.buildPayload();

      // When already saved directly, no schedule data should be included
      expect(payload.scheduleItems).toBeUndefined();
      expect(payload.summaries).toBeUndefined();
      expect(payload.subSummaries).toBeUndefined();
    });
  });

  // ── Toast notifications ─────────────────────────────────────────────────────

  describe("toast notifications", () => {
    it("shows a success toast and closes the modal on successful activation", async () => {
      const { result } = renderHook(() => useSetActiveModal(makeProps()));

      act(() => result.current.handleModeSelect("range"));
      act(() => result.current.toggleDay("Monday"));

      await act(async () => {
        await result.current.handleConfirm();
      });

      expect(mockCreateAsync).toHaveBeenCalledTimes(1);
      expect(mockToastShow).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          text1: "Success",
          text2: "Schedule has been set as active",
          position: "top",
        }),
      );
    });

    it("does not show a success toast when activation fails", async () => {
      mockCreateAsync.mockRejectedValueOnce(new Error("DB error"));

      const { result } = renderHook(() => useSetActiveModal(makeProps()));

      act(() => result.current.handleModeSelect("range"));
      act(() => result.current.toggleDay("Monday"));

      await act(async () => {
        await result.current.handleConfirm();
      });

      // No success toast should have been shown
      const successToasts = mockToastShow.mock.calls.filter(
        (call) => call[0]?.type === "success",
      );
      expect(successToasts).toHaveLength(0);

      // Reset the mock for subsequent tests
      mockCreateAsync.mockReset();
      mockCreateAsync.mockResolvedValue(undefined);
    });
  });

  // ── handleConfirm ────────────────────────────────────────────────────────────

  describe("handleConfirm", () => {
    it("sends the built payload to the activation service with overwrite=false and a start date on a selected weekday", async () => {
      const { result } = renderHook(() => useSetActiveModal(makeProps()));

      act(() => result.current.handleModeSelect("range"));
      act(() => result.current.toggleDay("Monday"));
      act(() => result.current.toggleDay("Wednesday"));

      await act(async () => {
        await result.current.handleConfirm();
      });

      expect(mockCreateAsync).toHaveBeenCalledTimes(1);
      const sentPayload = mockCreateAsync.mock.calls[0][0];

      expect(sentPayload.scheduleId).toBe("sched-test-001");
      expect(sentPayload.activeType).toBe("days");
      expect(sentPayload.recurring).toBe(false);
      expect(sentPayload.overwrite).toBe(false);
      expect(sentPayload.selectedDays).toEqual([1, 3]);
      expect(sentPayload.scheduleTimeStart).toBe("08:00");
      expect(sentPayload.sheduleTimeEnd).toBe("16:00");

      // The start date must be on a selected weekday (Mon=1 or Wed=3)
      expect([1, 3]).toContain(sentPayload.nonReccuringDaysTypeStartsAt.getDay());

      // Schedule data should be included in the payload sent to the service
      // so the activation domain can save it as temporary before creating
      // the activation record
      expect(sentPayload.scheduleItems).toEqual(scheduleItems);
      expect(sentPayload.summaries).toEqual([]);
      expect(sentPayload.subSummaries).toEqual([]);
    });
  });
});
