import { act, fireEvent, render } from "@testing-library/react-native";

// ── Module Mocks ───────────────────────────────────────────────────────────
// These are hoisted above imports by Jest's transform.

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/context/NewScheduleFormContext", () => ({
  useNewScheduleFormContext: jest.fn(),
}));

jest.mock("@/hooks/useAi", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/features/schedule/hooks/generation/useSaveScheduleModal", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/features/schedule/hooks/generation/useSetActiveModal", () => ({
  __esModule: true,
  useSetActiveModal: jest.fn(),
  DAYS: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
}));

jest.mock("@/features/schedule/hooks/generation/useActivationConflictModal", () => ({
  useActivationConflictModal: jest.fn(),
}));

jest.mock("lucide-react-native", () => ({
  AlertTriangle: () => null,
  HelpCircle: () => null,
}));

// Suppress @expo/vector-icons async font-loading act(...) warnings
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const MockIcon = (props: { name?: string; size?: number; color?: string }) =>
    React.createElement("span", { testID: `icon-${props.name || "default"}` });
  return new Proxy(MockIcon, {
    get: () => (props: { name?: string }) =>
      React.createElement("span", { testID: `icon-${props.name || "default"}` }),
  });
});

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import GenerateScheduleScreen from "@/app/schedule/generation";
import { useNewScheduleFormContext } from "@/context/NewScheduleFormContext";
import { useActivationConflictModal } from "@/features/schedule/hooks/generation/useActivationConflictModal";
import useSaveScheduleModal from "@/features/schedule/hooks/generation/useSaveScheduleModal";
import { useSetActiveModal } from "@/features/schedule/hooks/generation/useSetActiveModal";
import type { GenerationResult } from "@/features/schedule/utils/scheduleResponseParser";
import useAi from "@/hooks/useAi";
import type { NewScheduleFormState } from "@/type/NewScheduleTypes";

// ── Mock function references ────────────────────────────────────────────────

const mockHandleGenerateSchedule = jest.fn();
const mockAiResetState = jest.fn();

const mockUseAi = useAi as jest.MockedFunction<typeof useAi>;
const mockUseNewScheduleFormContext = useNewScheduleFormContext as jest.MockedFunction<
  typeof useNewScheduleFormContext
>;
const mockUseSaveScheduleModal = useSaveScheduleModal as jest.MockedFunction<
  typeof useSaveScheduleModal
>;
const mockUseSetActiveModal = useSetActiveModal as jest.MockedFunction<
  typeof useSetActiveModal
>;
const mockUseActivationConflictModal = useActivationConflictModal as jest.MockedFunction<
  typeof useActivationConflictModal
>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

// ── Fixtures ─────────────────────────────────────────────────────────────────

const mockInputForm: NewScheduleFormState = {
  scheduleType: "personal",
  startTime: new Date("2026-08-30T09:00:00"),
  endTime: new Date("2026-08-30T17:00:00"),
  showStartPicker: false,
  showEndPicker: false,
  appointments: [],
  meals: [],
  breakFrequency: "none",
  priorityFocusText: "Focused Work",
  priorityDurationMinutes: 120,
  eventType: null,
  eventOtherLabel: "",
  eventScheduleItems: [],
};

const mockResult: GenerationResult = {
  summary: [
    { id: "sum-001", schedule_id: "sched-001", name: "Work", total: "6h" },
    { id: "sum-002", schedule_id: "sched-001", name: "Breaks", total: "1h" },
  ],
  subSummary: [
    { id: "sub-001", summary_id: "sum-001", name: "Deep Work", total: "3h" },
    { id: "sub-002", summary_id: "sum-001", name: "Meetings", total: "3h" },
    { id: "sub-003", summary_id: "sum-002", name: "Coffee Break", total: "30m" },
    { id: "sub-004", summary_id: "sum-002", name: "Lunch", total: "30m" },
  ],
  schedule: [
    { start_time: "09:00", end_time: "12:00", activity: "Deep Work" },
    { start_time: "12:00", end_time: "12:30", activity: "Coffee Break" },
    { start_time: "12:30", end_time: "13:30", activity: "Lunch" },
    { start_time: "13:30", end_time: "15:30", activity: "Meetings" },
    { start_time: "15:30", end_time: "16:00", activity: "Coffee Break" },
  ],
};

/**
 * Gemini API can return a variety of error statuses. The key ones observed:
 *
 * 1. 503 UNAVAILABLE  – model overloaded / high demand (the example the user provided)
 * 2. 429 RESOURCE_EXHAUSTED – rate-limited, retry with backoff
 * 3. 400 INVALID_ARGUMENT – malformed request
 * 4. 401 UNAUTHENTICATED – bad/missing API key
 * 5. 403 PERMISSION_DENIED – key lacks access to the model
 * 6. 500 INTERNAL – transient internal error
 *
 * In the mobile app, `useAi` surfaces `error` as a plain string (the
 * `message` field parsed from the Gemini JSON payload by `getGeminiError`
 * in the API layer). The `ErrorCard` renders that string directly.
 */

const GEMINI_503_ERROR =
  "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.";

const GEMINI_429_ERROR =
  "You have run out of code executions! You can no longer write or execute code. Now you should continue solving the problem by relying on your mathematical reasoning and analytical skills.";

// ── Shared mock setup ──────────────────────────────────────────────────────

function setupMocks(
  options: {
    result?: GenerationResult | null;
    isGenerating?: boolean;
    error?: string | undefined;
  } = {},
) {
  const result = options.result ?? null;
  const isGenerating = options.isGenerating ?? false;
  const error = options.error ?? undefined;

  mockUseAi.mockReturnValue({
    result,
    generatedScheduleId: result ? "sched-001" : undefined,
    handleGenerateSchedule: mockHandleGenerateSchedule,
    resetState: mockAiResetState,
    completedSteps: [],
    isGenerating,
    error,
  });

  mockUseNewScheduleFormContext.mockReturnValue({
    inputForm: mockInputForm,
    resetState: jest.fn(),
    generateScheduleBasedOnForm: jest.fn(),
  });

  mockUseSaveScheduleModal.mockReturnValue({
    isSaveModalOpen: false,
    openSaveSchedModal: jest.fn(),
    closeSaveSchedModal: jest.fn(),
    handleSaveSchedule: jest.fn(),
    setName: jest.fn(),
    name: "",
    isSaving: false,
  });

  mockUseSetActiveModal.mockReturnValue({
    dateMode: null,
    selectedDays: [],
    disabledDays: [],
    specificDate: new Date(),
    showDatePicker: false,
    rangeAnchorDate: new Date(),
    showRangeDatePicker: false,
    rangeResolvedStart: null,
    rangeResolvedEnd: null,
    recurring: false,
    isSubmitting: false,
    summary: "",
    isConfirmBlocked: true,
    isTodayAvailable: false,
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
    isOpen: false,
    open: jest.fn(),
    resetState: jest.fn(),
    conflicts: [],
    isConflictModalOpen: false,
    isResolvingConflict: false,
    handleCancelConflicts: jest.fn(),
    handleResolveConflicts: jest.fn(),
    activationDayIndices: [],
    activationWindowStartMin: null,
    activationWindowEndMin: null,
  });

  mockUseActivationConflictModal.mockReturnValue({
    expandedConflictId: null,
    toggleExpand: jest.fn(),
    isInfoModalOpen: false,
    openInfoModal: jest.fn(),
    closeInfoModal: jest.fn(),
  });

  mockUseRouter.mockReturnValue({
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(),
    push: jest.fn(),
    navigate: jest.fn(),
    dismiss: jest.fn(),
  } as any);
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("GenerateScheduleScreen", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  describe("when schedule is received from useAi", () => {
    beforeEach(() => {
      setupMocks({ result: mockResult, isGenerating: false });
    });

    it("renders the schedule list (ScheduleTimeline)", () => {
      const { getByText, getAllByText } = render(<GenerateScheduleScreen />);
      expect(getByText("Your Schedule")).toBeTruthy();
      // Verify schedule items are rendered — "Deep Work" appears in both
      // SummaryCard (sub-summary) and ScheduleTimeline (schedule item)
      expect(getAllByText("Deep Work").length).toBeGreaterThanOrEqual(2);
      expect(getByText("12:00 – 12:30")).toBeTruthy();
    });

    it("renders the Summary card with category data", () => {
      const { getByText } = render(<GenerateScheduleScreen />);
      expect(getByText("Summary")).toBeTruthy();
      expect(getByText("Work")).toBeTruthy();
      expect(getByText("Breaks")).toBeTruthy();
    });

    it("renders the persistent (Save) button", () => {
      const { getByText } = render(<GenerateScheduleScreen />);
      expect(getByText("Save")).toBeTruthy();
    });

    it("renders the activation (Set Active) button", () => {
      const { getByText } = render(<GenerateScheduleScreen />);
      expect(getByText("Set Active")).toBeTruthy();
    });
  });

  describe("when Gemini API returns a 503 UNAVAILABLE error", () => {
    beforeEach(() => {
      setupMocks({ result: null, isGenerating: false, error: GEMINI_503_ERROR });
    });

    it("displays the API error message in the ErrorCard", () => {
      const { getByText } = render(<GenerateScheduleScreen />);
      expect(getByText(GEMINI_503_ERROR)).toBeTruthy();
    });

    it("renders the Retry button on the ErrorCard", () => {
      const { getByText } = render(<GenerateScheduleScreen />);
      expect(getByText("Retry")).toBeTruthy();
    });

    it("does NOT render schedule list, summary, Save, or Set Active when error is shown", () => {
      const { queryByText } = render(<GenerateScheduleScreen />);
      expect(queryByText("Your Schedule")).toBeNull();
      expect(queryByText("Summary")).toBeNull();
      expect(queryByText("Save")).toBeNull();
      expect(queryByText("Set Active")).toBeNull();
    });

    it("does NOT render the loading progress when error is shown", () => {
      const { queryByText } = render(<GenerateScheduleScreen />);
      expect(queryByText("Understanding your request...")).toBeNull();
    });
  });

  describe("when Gemini API returns a 429 RESOURCE_EXHAUSTED error", () => {
    it("displays the rate-limit error message in the ErrorCard", () => {
      setupMocks({ result: null, isGenerating: false, error: GEMINI_429_ERROR });
      const { getByText } = render(<GenerateScheduleScreen />);
      expect(getByText(GEMINI_429_ERROR)).toBeTruthy();
    });
  });

  describe("regenerate card countdown", () => {
    beforeEach(() => {
      setupMocks({ result: mockResult, isGenerating: false });
    });

    it("hides RegenerateCard before the 5500ms countdown elapses", () => {
      const { queryByText } = render(<GenerateScheduleScreen />);

      // Advance by a portion of the countdown — RegenerateCard should still be hidden
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(queryByText(/Not quite right/)).toBeNull();
      expect(queryByText("Regenerate")).toBeNull();
    });

    it("shows RegenerateCard after 5500ms countdown elapses", () => {
      const { getByText, queryByText } = render(<GenerateScheduleScreen />);

      // Before the 5500ms timer fires, RegenerateCard is hidden
      expect(queryByText("Regenerate")).toBeNull();
      expect(queryByText(/Not quite right/)).toBeNull();

      act(() => {
        jest.advanceTimersByTime(5500);
      });

      expect(getByText(/Not quite right/)).toBeTruthy();
      expect(getByText("Regenerate")).toBeTruthy();
    });

    it("does NOT show RegenerateCard while generating", () => {
      setupMocks({ result: mockResult, isGenerating: true });
      const { queryByText } = render(<GenerateScheduleScreen />);
      // While generating, showRegenerateCard is false
      expect(queryByText(/Not quite right/)).toBeNull();
    });
  });

  describe("retry functionality", () => {
    it("triggers regeneration when the ErrorCard Retry button is clicked", () => {
      setupMocks({ result: null, isGenerating: false, error: GEMINI_503_ERROR });
      const { getByText } = render(<GenerateScheduleScreen />);

      // The mount useEffect may call handleGenerateSchedule once (when result is null)
      mockHandleGenerateSchedule.mockClear();

      fireEvent.press(getByText("Retry"));

      expect(mockHandleGenerateSchedule).toHaveBeenCalledTimes(1);
      expect(mockHandleGenerateSchedule).toHaveBeenCalledWith(mockInputForm);
    });

    it("triggers regeneration when the RegenerateCard Regenerate button is clicked", () => {
      setupMocks({ result: mockResult, isGenerating: false });
      const { getByText } = render(<GenerateScheduleScreen />);

      // Advance past the countdown to reveal the RegenerateCard
      act(() => {
        jest.advanceTimersByTime(5500);
      });

      mockHandleGenerateSchedule.mockClear();

      fireEvent.press(getByText("Regenerate"));

      expect(mockHandleGenerateSchedule).toHaveBeenCalledTimes(1);
      expect(mockHandleGenerateSchedule).toHaveBeenCalledWith(mockInputForm);
    });
  });
});
