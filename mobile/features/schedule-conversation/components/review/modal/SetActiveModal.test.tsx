import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { useSetActiveModal } from "@/features/schedule/hooks/generation/useSetActiveModal";
import { SetActiveModal } from "../../../../schedule/components/GenerateScheduleScreen/modal/SetActiveModal";

// Mock the hook while providing DAYS for the component
jest.mock("@/features/schedule/hooks/generation/useSetActiveModal", () => {
  const DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return {
    DAYS,
    useSetActiveModal: jest.fn(),
  };
});

describe("SetActiveModal", () => {
  const mockHookReturn = {
    dateMode: "today" as const,
    recurring: false,
    selectedDays: [],
    disabledDays: [],
    specificDate: new Date("2026-06-01"),
    showDatePicker: false,
    rangeAnchorDate: new Date("2026-06-01"),
    showRangeDatePicker: false,
    rangeResolvedStart: null,
    rangeResolvedEnd: null,
    isSubmitting: false,
    summary: "Mock Summary",
    isConfirmBlocked: false,
    isTodayAvailable: true,
    setRecurring: jest.fn(),
    setShowDatePicker: jest.fn(),
    setShowRangeDatePicker: jest.fn(),
    handleModeSelect: jest.fn(),
    toggleDay: jest.fn(),
    handleDateChange: jest.fn(),
    handleRangeDateChange: jest.fn(),
    handleClose: jest.fn(),
    handleConfirm: jest.fn(),
    buildPayload: jest.fn(),
    isOpen: true,
    open: jest.fn(),
    resetState: jest.fn(),
    conflicts: [],
    isConflictModalOpen: false,
    isResolvingConflict: false,
    handleCancelConflicts: jest.fn(),
    handleResolveConflicts: jest.fn(),
    activationDayIndices: [0],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSetActiveModal as jest.Mock).mockReturnValue(mockHookReturn);
  });

  it("renders correctly when visible", () => {
    const { getByText } = render(<SetActiveModal {...mockHookReturn} />);

    expect(getByText("When should this be active?")).toBeTruthy();
    expect(getByText("Mock Summary")).toBeTruthy();
    expect(getByText("Today")).toBeTruthy();
    expect(getByText("Tomorrow")).toBeTruthy();
  });

  it("handles mode selection", () => {
    const { getByText } = render(<SetActiveModal {...mockHookReturn} />);

    fireEvent.press(getByText("Tomorrow"));
    expect(mockHookReturn.handleModeSelect).toHaveBeenCalledWith("tomorrow");
  });

  it("shows expanded day selection when mode is range", () => {
    const rangeProps = { ...mockHookReturn, dateMode: "range" as const };
    (useSetActiveModal as jest.Mock).mockReturnValue(rangeProps);

    const { getByText } = render(<SetActiveModal {...rangeProps} />);

    expect(getByText("Select Days")).toBeTruthy();
    // DayRangeExpanded should be visible, which contains day names like "Mon"
    expect(getByText("Mon")).toBeTruthy();
  });

  it("calls handleConfirm when confirm button is pressed", () => {
    const { getByText } = render(<SetActiveModal {...mockHookReturn} />);

    fireEvent.press(getByText("Confirm"));
    expect(mockHookReturn.handleConfirm).toHaveBeenCalled();
  });

  it("calls handleClose when close button is pressed", () => {
    const { getByText } = render(<SetActiveModal {...mockHookReturn} />);

    fireEvent.press(getByText("✕"));
    expect(mockHookReturn.handleClose).toHaveBeenCalled();
  });
});
