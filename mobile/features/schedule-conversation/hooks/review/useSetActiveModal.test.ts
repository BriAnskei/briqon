import { renderHook, act } from "@testing-library/react-native";
import { useSetActiveModal } from "./useSetActiveModal";
import { useSchedule } from "@/context/ScheduleContext";
import * as reviewHelpers from "../../util/reviewHelpers";

// Mock dependencies
jest.mock("@/context/ScheduleContext");
jest.mock("../../util/reviewHelpers", () => ({
  ...jest.requireActual("../../util/reviewHelpers"),
  buildSummary: jest.fn(),
  calculateActiveDays: jest.fn(),
}));

describe("useSetActiveModal", () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();
  const mockSetIsSchedActivatedModalOpen = jest.fn();

  const mockSelectedReviewItems = [
    { start_time: "08:00", end_time: "09:00", activity: "Breakfast" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (useSchedule as jest.Mock).mockReturnValue({
      selectedReviewItems: mockSelectedReviewItems,
    });

    (reviewHelpers.buildSummary as jest.Mock).mockReturnValue("Mock Summary");
    (reviewHelpers.calculateActiveDays as jest.Mock).mockReturnValue([0]);

    // Fixed date for testing: Monday, June 1, 2026 (Mon-based index 0)
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-01T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() =>
      useSetActiveModal({
        onClose: mockOnClose,
        onConfirm: mockOnConfirm,
        setIsSchedActivatedModalOpen: mockSetIsSchedActivatedModalOpen,
      }),
    );

    expect(result.current.dateMode).toBe("today");
    expect(result.current.recurring).toBe(false);
    expect(result.current.selectedDays).toEqual([0]); // Monday
    expect(result.current.canConfirm).toBe(true);
    expect(result.current.summary).toBe("Mock Summary");
  });

  it("handles mode selection: today", () => {
    const { result } = renderHook(() =>
      useSetActiveModal({
        onClose: mockOnClose,
        onConfirm: mockOnConfirm,
        setIsSchedActivatedModalOpen: mockSetIsSchedActivatedModalOpen,
      }),
    );

    // Initial is today, so handleModeSelect("today") will toggle it to null
    act(() => {
      result.current.handleModeSelect("today");
    });
    expect(result.current.dateMode).toBe(null);

    act(() => {
      result.current.handleModeSelect("today");
    });
    expect(result.current.dateMode).toBe("today");
    expect(result.current.selectedDays).toEqual([0]);
  });

  it("handles mode selection: tomorrow", () => {
    const { result } = renderHook(() =>
      useSetActiveModal({
        onClose: mockOnClose,
        onConfirm: mockOnConfirm,
        setIsSchedActivatedModalOpen: mockSetIsSchedActivatedModalOpen,
      }),
    );

    act(() => {
      result.current.handleModeSelect("tomorrow");
    });
    expect(result.current.dateMode).toBe("tomorrow");
    expect(result.current.selectedDays).toEqual([1]); // Tomorrow is Tuesday (1)
  });

  it("handles mode selection: range", () => {
    const { result } = renderHook(() =>
      useSetActiveModal({
        onClose: mockOnClose,
        onConfirm: mockOnConfirm,
        setIsSchedActivatedModalOpen: mockSetIsSchedActivatedModalOpen,
      }),
    );

    act(() => {
      result.current.handleModeSelect("range");
    });
    expect(result.current.dateMode).toBe("range");
    expect(result.current.selectedDays).toEqual([]);
    expect(result.current.canConfirm).toBe(false); // range requires selectedDays.length > 0
  });

  it("toggles days", () => {
    const { result } = renderHook(() =>
      useSetActiveModal({
        onClose: mockOnClose,
        onConfirm: mockOnConfirm,
        setIsSchedActivatedModalOpen: mockSetIsSchedActivatedModalOpen,
      }),
    );

    act(() => {
      result.current.handleModeSelect("range");
    });

    act(() => {
      result.current.toggleDay(2); // Wednesday (2)
    });
    expect(result.current.selectedDays).toContain(2);

    act(() => {
      result.current.toggleDay(2);
    });
    expect(result.current.selectedDays).not.toContain(2);
  });

  it("respects disabled days in toggleDay", () => {
    const { result } = renderHook(() =>
      useSetActiveModal({
        onClose: mockOnClose,
        onConfirm: mockOnConfirm,
        setIsSchedActivatedModalOpen: mockSetIsSchedActivatedModalOpen,
      }),
    );

    // Set range starts at to Wednesday (JS 3, Mon-based 2)
    // Mon-based indices before 2 are 0 (Mon), 1 (Tue)
    act(() => {
      result.current.handleRangeStartsAtChange(new Date("2026-06-03"));
    });

    expect(result.current.disabledDays).toEqual([0, 1]);

    act(() => {
      result.current.toggleDay(0); // Monday should be ignored
    });
    expect(result.current.selectedDays).not.toContain(0);

    act(() => {
      result.current.toggleDay(1); // Tuesday should be ignored
    });
    expect(result.current.selectedDays).not.toContain(1);

    act(() => {
      result.current.toggleDay(2); // Wednesday should work
    });
    expect(result.current.selectedDays).toContain(2);
  });

  it("handles range starts at change and resets selected days", () => {
    const { result } = renderHook(() =>
      useSetActiveModal({
        onClose: mockOnClose,
        onConfirm: mockOnConfirm,
        setIsSchedActivatedModalOpen: mockSetIsSchedActivatedModalOpen,
      }),
    );

    const testDate = new Date("2026-06-04");
    const testDateMidnight = new Date(testDate);
    testDateMidnight.setHours(0, 0, 0, 0);

    act(() => {
      result.current.handleModeSelect("range");
      result.current.toggleDay(4); // Friday (4)
    });
    expect(result.current.selectedDays).toContain(4);

    act(() => {
      result.current.handleRangeStartsAtChange(testDate);
    });

    expect(result.current.selectedDays).toEqual([]);
    expect(result.current.rangeStartsAt).toEqual(testDateMidnight);
  });

  it("handles save schedule state", () => {
    const { result } = renderHook(() =>
      useSetActiveModal({
        onClose: mockOnClose,
        onConfirm: mockOnConfirm,
        setIsSchedActivatedModalOpen: mockSetIsSchedActivatedModalOpen,
      }),
    );

    act(() => {
      result.current.setSaveSchedule(true);
      result.current.setScheduleName("Work Routine");
    });

    expect(result.current.saveSchedule).toBe(true);
    expect(result.current.scheduleName).toBe("Work Routine");
  });

  it("handles confirm with save schedule", async () => {
    const { result } = renderHook(() =>
      useSetActiveModal({
        onClose: mockOnClose,
        onConfirm: mockOnConfirm,
        setIsSchedActivatedModalOpen: mockSetIsSchedActivatedModalOpen,
      }),
    );

    act(() => {
      result.current.setSaveSchedule(true);
      result.current.setScheduleName("   My Plan   ");
    });

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(mockSetIsSchedActivatedModalOpen).toHaveBeenCalledWith(true);
  });

  it("resets state on handleClose including new fields", () => {
    const { result } = renderHook(() =>
      useSetActiveModal({
        onClose: mockOnClose,
        onConfirm: mockOnConfirm,
        setIsSchedActivatedModalOpen: mockSetIsSchedActivatedModalOpen,
      }),
    );

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    act(() => {
      result.current.handleModeSelect("range");
      result.current.setRecurring(true);
      result.current.setScheduleName("Test Schedule");
      result.current.setSaveSchedule(true);
      result.current.handleRangeStartsAtChange(new Date("2026-06-10"));
    });

    act(() => {
      result.current.handleClose();
    });

    expect(result.current.dateMode).toBe("today");
    expect(result.current.recurring).toBe(false);
    expect(result.current.scheduleName).toBe("");
    expect(result.current.saveSchedule).toBe(false);
    expect(result.current.rangeStartsAt).toEqual(todayMidnight);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("updates specific date via handleDateChange", () => {
    const { result } = renderHook(() =>
      useSetActiveModal({
        onClose: mockOnClose,
        onConfirm: mockOnConfirm,
        setIsSchedActivatedModalOpen: mockSetIsSchedActivatedModalOpen,
      }),
    );

    const newDate = new Date("2026-07-01");
    act(() => {
      result.current.handleDateChange({}, newDate);
    });

    expect(result.current.specificDate).toEqual(newDate);
  });
});
