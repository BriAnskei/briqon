import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { SetActiveModal } from "../../../../schedule/components/GenerateScheduleScreen/modal/SetActiveModal";
import { useSetActiveModal } from "@/features/schedule-conversation/hooks/review/useSetActiveModal";

// Mock the hook
jest.mock("@/features/schedule-conversation/hooks/review/useSetActiveModal");

describe("SetActiveModal", () => {
	const mockProps = {
		visible: true,
		onClose: jest.fn(),
		onConfirm: jest.fn(),
		isScheduleAlreadySave: false,
		setIsSchedActivatedModalOpen: jest.fn(),
	};

	const mockHookReturn = {
		dateMode: "today",
		recurring: false,
		selectedDays: [0],
		specificDate: new Date("2026-06-01"),
		showDatePicker: false,
		disabledDays: [],
		rangeStartsAt: new Date("2026-06-01"),
		showRangeStartsPicker: false,
		canConfirm: true,
		summary: "Mock Summary",
		isSubmitting: false,
		setRecurring: jest.fn(),
		toggleDay: jest.fn(),
		setShowDatePicker: jest.fn(),
		setShowRangeStartsPicker: jest.fn(),
		handleModeSelect: jest.fn(),
		handleDateChange: jest.fn(),
		handleRangeStartsAtChange: jest.fn(),
		handleClose: jest.fn(),
		handleConfirm: jest.fn(),
		scheduleName: "",
		setScheduleName: jest.fn(),
		saveSchedule: false,
		setSaveSchedule: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
		(useSetActiveModal as jest.Mock).mockReturnValue(mockHookReturn);
	});

	it("renders correctly when visible", () => {
		const { getByText } = render(<SetActiveModal {...mockProps} />);

		expect(getByText("When should this be active?")).toBeTruthy();
		expect(getByText("Mock Summary")).toBeTruthy();
		expect(getByText("Today")).toBeTruthy();
		expect(getByText("Tomorrow")).toBeTruthy();
	});

	it("handles mode selection", () => {
		const { getByText } = render(<SetActiveModal {...mockProps} />);

		fireEvent.press(getByText("Tomorrow"));
		expect(mockHookReturn.handleModeSelect).toHaveBeenCalledWith("tomorrow");
	});

	it("shows expanded day selection when mode is range", () => {
		(useSetActiveModal as jest.Mock).mockReturnValue({
			...mockHookReturn,
			dateMode: "range",
		});

		const { getByText } = render(<SetActiveModal {...mockProps} />);

		expect(getByText("Select Days")).toBeTruthy();
		// DayRangeExpanded should be visible, which contains day names like "Mon"
		expect(getByText("Mon")).toBeTruthy();
	});

	it("handles toggling the switches", () => {
		const { getAllByRole } = render(<SetActiveModal {...mockProps} />);

		const switches = getAllByRole("switch");

		// First switch is "Repeat every week"
		fireEvent(switches[0], "onValueChange", true);
		expect(mockHookReturn.setRecurring).toHaveBeenCalledWith(true);

		// Second switch is "Save this schedule"
		fireEvent(switches[1], "onValueChange", true);
		expect(mockHookReturn.setSaveSchedule).toHaveBeenCalledWith(true);
	});

	it("shows name input when saveSchedule is true", () => {
		(useSetActiveModal as jest.Mock).mockReturnValue({
			...mockHookReturn,
			saveSchedule: true,
			scheduleName: "My New Schedule",
		});

		const { getByPlaceholderText, getByDisplayValue } = render(
			<SetActiveModal {...mockProps} />,
		);

		expect(getByPlaceholderText("Schedule name…")).toBeTruthy();
		expect(getByDisplayValue("My New Schedule")).toBeTruthy();
	});

	it("disables confirm button when isConfirmBlocked is true", () => {
		(useSetActiveModal as jest.Mock).mockReturnValue({
			...mockHookReturn,
			canConfirm: false,
		});

		const { getByText } = render(<SetActiveModal {...mockProps} />);
		const confirmBtn = getByText("Confirm");

		fireEvent.press(confirmBtn);
		expect(mockHookReturn.handleConfirm).not.toHaveBeenCalled();
	});

	it("calls handleConfirm when confirm button is pressed", () => {
		const { getByText } = render(<SetActiveModal {...mockProps} />);

		fireEvent.press(getByText("Confirm"));
		expect(mockHookReturn.handleConfirm).toHaveBeenCalled();
	});

	it("calls handleClose when close button is pressed", () => {
		const { getByText } = render(<SetActiveModal {...mockProps} />);

		fireEvent.press(getByText("✕"));
		expect(mockHookReturn.handleClose).toHaveBeenCalled();
	});
});
