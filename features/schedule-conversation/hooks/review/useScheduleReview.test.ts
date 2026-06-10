import { renderHook, act } from "@testing-library/react-native";
import { useScheduleReview } from "./useScheduleReview";
import { useSchedule } from "@/context/ScheduleContext";
import { useToast } from "@/hooks/useToast";
import { ScheduleService } from "@/src/service/schedule.service";
import { useRouter } from "expo-router";

// Mock dependencies
jest.mock("@/context/ScheduleContext");
jest.mock("@/hooks/useToast");
jest.mock("@/src/service/schedule.service");
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

describe("useScheduleReview", () => {
  const mockShowToast = jest.fn() as jest.MockedFunction<any>;
  const mockCreateSchedule = jest.fn() as jest.MockedFunction<any>;
  const mockBack = jest.fn() as jest.MockedFunction<any>;
  const mockPush = jest.fn() as jest.MockedFunction<any>;

  const mockSelectedItems = [
    { start_time: "08:00", end_time: "09:00", activity: "Breakfast" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (useSchedule as jest.Mock).mockReturnValue({
      selectedReviewItems: mockSelectedItems,
    });

    (useToast as jest.Mock).mockReturnValue({
      showToast: mockShowToast,
    });

    (useRouter as jest.Mock).mockReturnValue({
      back: mockBack,
      push: mockPush,
    });

    // Mock ScheduleService instance
    (ScheduleService as jest.Mock).mockImplementation(() => ({
      createSchedule: mockCreateSchedule,
    }));

    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("initializes with default states", () => {
    const { result } = renderHook(() => useScheduleReview());

    expect(result.current.isSaveScheduleModalOpen).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.scheduleItems).toEqual(mockSelectedItems);
  });

  it("opens and closes the save modal", () => {
    const { result } = renderHook(() => useScheduleReview());

    act(() => {
      result.current.openSaveScheduleModal();
    });
    expect(result.current.isSaveScheduleModalOpen).toBe(true);

    act(() => {
      result.current.closeSaveScheduleModal();
    });
    expect(result.current.isSaveScheduleModalOpen).toBe(false);
  });

  it("handles successful save", async () => {
    mockCreateSchedule.mockResolvedValueOnce({ id: "1" });
    const { result } = renderHook(() => useScheduleReview());

    // Open modal first
    act(() => {
      result.current.openSaveScheduleModal();
    });

    await act(async () => {
      await result.current.handleSave("New Schedule");
    });

    expect(mockCreateSchedule).toHaveBeenCalledWith({
      name: "New Schedule",
      schedule_list: mockSelectedItems,
      temporary: false,
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        title: "Success",
        message: "Schedule saved successfully!",
      }),
    );

    expect(result.current.isSaveScheduleModalOpen).toBe(false);
    expect(result.current.isSaving).toBe(false);
  });

  it("handles save failure", async () => {
    const error = new Error("Database error");
    mockCreateSchedule.mockRejectedValueOnce(error);
    const { result } = renderHook(() => useScheduleReview());

    act(() => {
      result.current.openSaveScheduleModal();
    });

    await act(async () => {
      await result.current.handleSave("New Schedule");
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        title: "Save Failed",
        message: "An unexpected error occurred.",
      }),
    );

    // Modal should stay open on failure (Senior UX)
    expect(result.current.isSaveScheduleModalOpen).toBe(true);
    expect(result.current.isSaving).toBe(false);
  });
});
