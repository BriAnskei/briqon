import { renderHook, act } from "@testing-library/react-native";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { useSchedule } from "@/context/ScheduleContext";
import { useAI } from "@/context/AIContext";
import { WizardPromptBuilder } from "../utils/WizardPromptBuilder";
import { useWizardForm } from "./useWizardForm";
import type { NewScheduleFormState } from "@/type/NewScheduleTypes";

// ---------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn(), hide: jest.fn() },
}));

jest.mock("@/context/ScheduleContext");
jest.mock("@/context/AIContext");

jest.mock("../utils/WizardPromptBuilder", () => ({
  WizardPromptBuilder: {
    build: jest.fn(() => ({
      systemInstruction: "mock-system",
      prompt: "mock-prompt",
    })),
  },
}));

// uuid is ESM by default and is only used inside useMeals to generate ids.
// Stub it so we don't need to configure an ESM transform just for tests.
jest.mock("uuid", () => ({ v4: () => "test-uuid" }));

// Keep formatMinutes/formatTime/getDurationMins/etc. real (nothing here
// needs to fake those), but replace the three "starting state" factories
// with fixed, deterministic values instead of the real new Date()-based
// ones, so tests don't depend on what time it happens to be when they run.
jest.mock("../utils/wizardHelpers", () => ({
  ...jest.requireActual("../utils/wizardHelpers"),
  defaultForm: jest.fn(),
  defaultEventItemDraft: jest.fn(),
  defaultAppointmentDraft: jest.fn(),
}));

// PERSONAL_TOTAL_STEPS / EVENT_TOTAL_STEPS mocked to fixed values so tests
// aren't coupled to product decisions that are still evolving. Everything
// else in the module (e.g. APPOINTMENT_TYPES) stays real.
jest.mock("../contants/wizardOptions", () => ({
  ...jest.requireActual("../contants/wizardOptions"),
  PERSONAL_TOTAL_STEPS: 4,
  EVENT_TOTAL_STEPS: 3,
}));

import {
  defaultForm,
  defaultEventItemDraft,
  defaultAppointmentDraft,
} from "../utils/wizardHelpers";

// ---------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------

function makeDefaultForm(): NewScheduleFormState {
  return {
    scheduleType: null,
    startTime: new Date("2026-07-07T00:00:00"),
    endTime: new Date("2026-07-07T00:00:00"), // equal times -> wraps to a 24h window
    showStartPicker: false,
    showEndPicker: false,
    appointments: [],
    meals: [],
    breakFrequency: null,
    priorityFocusText: "",
    priorityDurationMinutes: 0,
    eventType: null,
    eventOtherLabel: "",
    eventScheduleItems: [],
  };
}

const mockGenerateSchedule = jest.fn().mockResolvedValue(undefined);
const mockRouterBack = jest.fn();
const mockRouterReplace = jest.fn();
const mockSetPrevScheduleFormInput = jest.fn();
const mockHandleScheduleGeneration = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockGenerateSchedule.mockResolvedValue(undefined);

  (defaultForm as jest.Mock).mockImplementation(makeDefaultForm);
  (defaultEventItemDraft as jest.Mock).mockImplementation(() => ({
    visible: false,
    name: "",
    durationHours: "",
    durationMinutes: "45", // matches wizardHelpers.defaultEventItemDraft
    isFixedTime: false,
    fixedTime: undefined,
    showFixedTimePicker: false,
  }));
  (defaultAppointmentDraft as jest.Mock).mockImplementation(() => ({
    visible: false,
    type: "work",
    customLabel: "",
    startTime: new Date("2026-07-07T09:00:00"),
    endTime: new Date("2026-07-07T10:00:00"),
    showStartPicker: false,
    showEndPicker: false,
  }));

  (useRouter as jest.Mock).mockReturnValue({
    back: mockRouterBack,
    replace: mockRouterReplace,
  });

  (useSchedule as jest.Mock).mockReturnValue({
    handleScheduleGeneration: mockHandleScheduleGeneration,
    prevScheduleForm: undefined,
    setPrevScheduleFormInput: mockSetPrevScheduleFormInput,
  });

  (useAI as jest.Mock).mockReturnValue({
    service: { generateSchedule: mockGenerateSchedule },
  });
});

// ---------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------

describe("useWizardForm", () => {
  describe("initial state", () => {
    it("starts on step 0 with the default form, no step error, and no toast fired", () => {
      const { result } = renderHook(() => useWizardForm());

      expect(result.current.step).toBe(0);
      expect(result.current.form).toEqual(makeDefaultForm());
      expect(result.current.isEvent).toBe(false);
      expect(result.current.totalSteps).toBe(4); // mocked PERSONAL_TOTAL_STEPS
      expect(result.current.stepError).toBeUndefined();
      expect(Toast.show).not.toHaveBeenCalled();
      expect(Toast.hide).not.toHaveBeenCalled();
    });
  });

  describe("canProceed vs. stepError — these are two independent gates", () => {
    it("canProceed() at step 0 requires a scheduleType to be chosen", () => {
      const { result } = renderHook(() => useWizardForm());

      expect(result.current.canProceed()).toBe(false);

      act(() => result.current.patch({ scheduleType: "personal" }));

      expect(result.current.canProceed()).toBe(true);
    });

    it("handleNext() respects canProceed() — it blocks advancing when canProceed() is false", async () => {
      // handleNext() early-returns when canProceed() is false, so the hook
      // enforces the same ordering the UI's disabled "Next" button does.
      const { result } = renderHook(() => useWizardForm());

      expect(result.current.canProceed()).toBe(false); // no scheduleType chosen
      expect(result.current.stepError).toBeUndefined();

      await act(async () => {
        await result.current.handleNext();
      });

      expect(result.current.step).toBe(0); // blocked — did NOT advance

      // Once a scheduleType is chosen, canProceed() is true and Next advances.
      act(() => result.current.patch({ scheduleType: "personal" }));
      expect(result.current.canProceed()).toBe(true);

      await act(async () => {
        await result.current.handleNext();
      });
      expect(result.current.step).toBe(1);
    });

    it("canProceed() for personal flow: step 1 always true, step 2 requires breakFrequency, step 3 requires priorityFocusText", async () => {
      const { result } = renderHook(() => useWizardForm());
      act(() => result.current.patch({ scheduleType: "personal" }));

      // step 1
      expect(result.current.canProceed()).toBe(true); // step 0 satisfied
      await act(async () => {
        await result.current.handleNext();
      });
      expect(result.current.step).toBe(1);
      expect(result.current.canProceed()).toBe(true); // step 1 always true

      // step 2
      await act(async () => {
        await result.current.handleNext();
      });
      expect(result.current.step).toBe(2);
      expect(result.current.canProceed()).toBe(false); // breakFrequency still null

      act(() => result.current.patch({ breakFrequency: "none" }));
      expect(result.current.canProceed()).toBe(true);

      // step 3
      await act(async () => {
        await result.current.handleNext();
      });
      expect(result.current.step).toBe(3);
      expect(result.current.canProceed()).toBe(false); // priorityFocusText empty

      act(() => result.current.patch({ priorityFocusText: "Deep work" }));
      expect(result.current.canProceed()).toBe(true);
    });
  });

  describe("step-level validation errors trigger toast, and block advancing", () => {
    it("surfaces the breaks validators not-enough-free-time error on step 2 and blocks Next", async () => {
      const { result } = renderHook(() => useWizardForm());

      // A 2h window fully packed with an appointment leaves no room for the
      // "balanced" break allotment, so validateBreakFreqWindow fails.
      act(() =>
        result.current.patch({
          scheduleType: "personal",
          startTime: new Date("2026-07-07T08:00:00"),
          endTime: new Date("2026-07-07T10:00:00"),
          breakFrequency: "balanced",
          appointments: [
            {
              id: "a1",
              type: "work",
              customLabel: "",
              startTime: new Date("2026-07-07T08:00:00"),
              endTime: new Date("2026-07-07T10:00:00"),
            },
          ],
        }),
      );

      await act(async () => {
        await result.current.handleNext(); // step 0 -> 1
      });
      await act(async () => {
        await result.current.handleNext(); // step 1 -> 2
      });

      expect(result.current.step).toBe(2);
      expect(result.current.stepError).toContain(
        "There isn't enough free time",
      );
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          text1: "Invalid Input",
          text2: expect.stringContaining("There isn't enough free time"),
          position: "top",
        }),
      );

      const toastCallsBeforeRetry = (Toast.show as jest.Mock).mock.calls.length;

      // User taps Next again without fixing anything — should re-toast and
      // NOT advance the step.
      await act(async () => {
        await result.current.handleNext();
      });
      expect(result.current.step).toBe(2); // still stuck on step 2
      expect((Toast.show as jest.Mock).mock.calls.length).toBeGreaterThan(
        toastCallsBeforeRetry,
      );

      // Switching to "none" clears the break error, hides the toast, and unblocks Next.
      act(() => result.current.patch({ breakFrequency: "none" }));
      expect(result.current.stepError).toBeUndefined();
      expect(Toast.hide).toHaveBeenCalled();

      await act(async () => {
        await result.current.handleNext();
      });
      expect(result.current.step).toBe(3);
    });

    it("shows a remaining-time error on the priority step when the requested duration doesn't fit, and clears once it does", async () => {
      const { result } = renderHook(() => useWizardForm());

      // 240-minute window, 90 min appointment, 30 min meal, balanced break
      // (0.12 * 240 = 28.8) -> ~91.2 minutes remain for priority focus time.
      act(() =>
        result.current.patch({
          scheduleType: "personal",
          startTime: new Date("2026-07-07T08:00:00"),
          endTime: new Date("2026-07-07T12:00:00"),
          appointments: [
            {
              id: "a1",
              type: "work",
              customLabel: "Work",
              startTime: new Date("2026-07-07T08:00:00"),
              endTime: new Date("2026-07-07T09:30:00"),
            },
          ],
          meals: [
            {
              id: "m1",
              type: "breakfast",
              durationMinutes: 30,
              placement: "flexible",
            },
          ],
        }),
      );

      await act(async () => {
        await result.current.handleNext(); // -> step 1
      });
      act(() => result.current.patch({ breakFrequency: "balanced" }));
      await act(async () => {
        await result.current.handleNext(); // -> step 2
      });
      await act(async () => {
        await result.current.handleNext(); // -> step 3
      });
      expect(result.current.step).toBe(3);
      expect(result.current.stepError).toBeUndefined(); // priorityDurationMinutes is 0 by default

      act(() => result.current.patch({ priorityDurationMinutes: 200 }));

      expect(result.current.stepError).toContain("remaining time");
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text2: expect.stringContaining("remaining time"),
        }),
      );

      act(() => result.current.patch({ priorityDurationMinutes: 60 }));
      expect(result.current.stepError).toBeUndefined();
      expect(Toast.hide).toHaveBeenCalled();
    });
  });

  describe("final step submission", () => {
    it("builds the prompt and navigates to the generation screen on the last step when there's no step error", async () => {
      const { result } = renderHook(() => useWizardForm());

      act(() =>
        result.current.patch({
          scheduleType: "personal",
          breakFrequency: "none",
          priorityFocusText: "Deep work",
          priorityDurationMinutes: 30,
        }),
      );

      await act(async () => {
        await result.current.handleNext(); // 0 -> 1
      });
      await act(async () => {
        await result.current.handleNext(); // 1 -> 2
      });
      await act(async () => {
        await result.current.handleNext(); // 2 -> 3 (last step, totalSteps=4)
      });

      expect(result.current.isLastStep()).toBe(true);

      await act(async () => {
        await result.current.handleNext(); // submit
      });

      expect(WizardPromptBuilder.build).toHaveBeenCalledWith(
        result.current.form,
      );
      // The hook now routes to the generation screen instead of invoking the
      // AI service directly (the generate call is currently commented out).
      expect(mockRouterReplace).toHaveBeenCalledWith("/schedule/generation");
      expect(mockGenerateSchedule).not.toHaveBeenCalled();
      // Submitting doesn't advance past the last step index.
      expect(result.current.step).toBe(3);
    });
  });

  describe("event flow", () => {
    it("uses EVENT_TOTAL_STEPS and surfaces event validation (e.g. a fixed-time item outside the window) on step 2, blocking Next", async () => {
      const { result } = renderHook(() => useWizardForm());

      act(() => result.current.patch({ scheduleType: "event" }));

      expect(result.current.isEvent).toBe(true);
      expect(result.current.totalSteps).toBe(3); // mocked EVENT_TOTAL_STEPS

      // Steps 0 and 1 don't gate on event-schedule validation, so no toast
      // and no stepError there.
      expect(result.current.stepError).toBeUndefined();
      await act(async () => {
        await result.current.handleNext(); // -> step 1
      });
      expect(result.current.step).toBe(1);
      expect(result.current.stepError).toBeUndefined();
      expect(Toast.show).not.toHaveBeenCalled();

      // The event details step (step 2) requires an eventType to be chosen.
      act(() => result.current.patch({ eventType: "birthday" }));
      await act(async () => {
        await result.current.handleNext(); // -> step 2
      });
      expect(result.current.step).toBe(2);

      // Window 08:00–20:00. Add a fixed-time item at 21:00 — outside the
      // window. This exercises EventScheduleValidator.validateEventConflicts,
      // which now checks fixed-time blocks against the window.
      act(() =>
        result.current.patch({
          startTime: new Date("2026-07-07T08:00:00"),
          endTime: new Date("2026-07-07T20:00:00"),
        }),
      );
      act(() =>
        result.current.eventItemsState.patchEventItem({
          visible: true,
          name: "Evening toast",
          isFixedTime: true,
          fixedTime: new Date("2026-07-07T21:00:00"),
        }),
      );
      act(() => result.current.eventItemsState.commitEventItem());

      expect(result.current.stepError).toContain(
        "outside the schedule time window",
      );
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          text1: "Invalid Input",
          text2: expect.stringContaining("outside the schedule time window"),
          position: "top",
        }),
      );

      // Tapping Next with the conflict unfixed re-toasts and stays on step 2.
      const toastCallsBeforeRetry = (Toast.show as jest.Mock).mock.calls.length;
      await act(async () => {
        await result.current.handleNext();
      });
      expect(result.current.step).toBe(2);
      expect((Toast.show as jest.Mock).mock.calls.length).toBeGreaterThan(
        toastCallsBeforeRetry,
      );

      // Removing the offending item clears the error and unblocks Next.
      const badId = result.current.form.eventScheduleItems[0].id;
      act(() => result.current.eventItemsState.removeEventItem(badId));
      expect(result.current.stepError).toBeUndefined();
      expect(Toast.hide).toHaveBeenCalled();
    });

    it("canProceed() for the event flow: step 1 requires eventType, and 'other' requires a label", async () => {
      const { result } = renderHook(() => useWizardForm());
      act(() => result.current.patch({ scheduleType: "event" }));

      expect(result.current.canProceed()).toBe(true); // step 0 satisfied

      act(() =>
        result.current.patch({ eventType: "other", eventOtherLabel: "" }),
      );

      await act(async () => {
        await result.current.handleNext(); // -> step 1
      });

      expect(result.current.step).toBe(1);
      expect(result.current.canProceed()).toBe(false); // "other" with blank label

      act(() => result.current.patch({ eventOtherLabel: "Company picnic" }));
      expect(result.current.canProceed()).toBe(true);

      act(() => result.current.patch({ eventType: "birthday" }));
      expect(result.current.canProceed()).toBe(true); // non-"other" type never needs a label
    });
  });

  describe("event schedule items", () => {
    it("does not commit an event item when the draft is blank or hidden", () => {
      const { result } = renderHook(() => useWizardForm());

      act(() => result.current.eventItemsState.commitEventItem());
      expect(result.current.form.eventScheduleItems).toHaveLength(0);

      act(() =>
        result.current.eventItemsState.patchEventItem({
          visible: true,
          name: "   ",
        }),
      );
      act(() => result.current.eventItemsState.commitEventItem());
      expect(result.current.form.eventScheduleItems).toHaveLength(0);
    });

    it("commits a valid event item and resets the draft, then can remove it", () => {
      const { result } = renderHook(() => useWizardForm());

      act(() =>
        result.current.eventItemsState.patchEventItem({
          visible: true,
          name: "Cake cutting",
          durationHours: "",
          durationMinutes: "15",
        }),
      );
      act(() => result.current.eventItemsState.commitEventItem());

      expect(result.current.form.eventScheduleItems).toHaveLength(1);
      expect(result.current.form.eventScheduleItems[0]).toMatchObject({
        name: "Cake cutting",
        durationMinutes: 15, // "15" min parsed to a number by useEventItems
      });
      // Draft resets back to the (mocked) default after commit.
      expect(result.current.eventItemsState.eventItemDraft).toEqual({
        visible: false,
        name: "",
        durationHours: "",
        durationMinutes: "45",
        isFixedTime: false,
        fixedTime: undefined,
        showFixedTimePicker: false,
      });

      const id = result.current.form.eventScheduleItems[0].id;
      act(() => result.current.eventItemsState.removeEventItem(id));
      expect(result.current.form.eventScheduleItems).toHaveLength(0);
    });

    it("Cannot commit event item when there is no duration input", () => {
      const { result } = renderHook(() => useWizardForm());

      act(() =>
        result.current.eventItemsState.patchEventItem({
          visible: true,
          name: "Toast",
        }),
      );
      act(() => result.current.eventItemsState.toggleFixedTime()); // isFixedTime -> true, fixedTime defaults in
      act(() =>
        result.current.eventItemsState.patchEventItem({
          fixedTime: new Date("2026-07-07T12:00:00"),
          durationHours: "",
          durationMinutes: "", // no duration entered -> null on commit
        }),
      );
      act(() => result.current.eventItemsState.commitEventItem());

      expect(result.current.form.eventScheduleItems).toHaveLength(0);
      const item = result.current.form.eventScheduleItems[0];
    });
  });

  describe("meals & appointments integration", () => {
    it("reflects meal and appointment changes in fixedScheduleDuration via the real validator", () => {
      const { result } = renderHook(() => useWizardForm());

      expect(result.current.fixedScheduleDuration).toEqual({
        appMinutes: 0,
        mealMinutes: 0,
        overAllMinutes: 0,
      });

      act(() => result.current.mealsState.toggleMealType("breakfast", 30));
      expect(result.current.fixedScheduleDuration.mealMinutes).toBe(30);

      act(() => result.current.apptState.showDraft());
      act(() => result.current.apptState.commitAppointment()); // uses mocked 9:00-10:00 draft = 60 min

      expect(result.current.fixedScheduleDuration.appMinutes).toBe(60);
      expect(result.current.fixedScheduleDuration.overAllMinutes).toBe(90);

      // Toggling the same meal type off again removes it.
      act(() => result.current.mealsState.toggleMealType("breakfast", 30));
      expect(result.current.fixedScheduleDuration.mealMinutes).toBe(0);
    });
  });

  describe("step 1 validation errors (appointments / meals / conflicts)", () => {
    it("surfaces an appointment-overlap conflict on step 1 and blocks Next", async () => {
      const { result } = renderHook(() => useWizardForm());

      act(() =>
        result.current.patch({
          scheduleType: "personal",
          startTime: new Date("2026-07-07T08:00:00"),
          endTime: new Date("2026-07-07T20:00:00"), // 12h window
          appointments: [
            {
              id: "a1",
              type: "work",
              customLabel: "",
              startTime: new Date("2026-07-07T09:00:00"),
              endTime: new Date("2026-07-07T10:30:00"),
            },
            {
              id: "a2",
              type: "medical",
              customLabel: "",
              startTime: new Date("2026-07-07T10:00:00"),
              endTime: new Date("2026-07-07T11:00:00"),
            },
          ],
        }),
      );

      await act(async () => {
        await result.current.handleNext(); // 0 -> 1
      });
      expect(result.current.step).toBe(1);
      expect(result.current.stepError).toContain("conflicts with");
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text2: expect.stringContaining("conflicts with"),
        }),
      );

      // Tapping Next again with the conflict unfixed should re-toast and
      // NOT advance past step 1.
      const toastCallsBeforeRetry = (Toast.show as jest.Mock).mock.calls.length;
      await act(async () => {
        await result.current.handleNext();
      });
      expect(result.current.step).toBe(1);
      expect((Toast.show as jest.Mock).mock.calls.length).toBeGreaterThan(
        toastCallsBeforeRetry,
      );

      // Removing the overlapping appointment clears the error and unblocks.
      act(() =>
        result.current.patch({
          appointments: result.current.form.appointments.slice(0, 1),
        }),
      );
      expect(result.current.stepError).toBeUndefined();
      expect(Toast.hide).toHaveBeenCalled();
    });

    it("surfaces a fixed-time meal placed outside the window on step 1", async () => {
      const { result } = renderHook(() => useWizardForm());

      act(() =>
        result.current.patch({
          scheduleType: "personal",
          startTime: new Date("2026-07-07T08:00:00"),
          endTime: new Date("2026-07-07T20:00:00"), // 12h window
          meals: [
            {
              id: "m1",
              type: "lunch",
              durationMinutes: 45,
              placement: "fixed_time",
              fixedTime: new Date("2026-07-07T21:00:00"), // outside the window
            },
          ],
        }),
      );

      await act(async () => {
        await result.current.handleNext(); // 0 -> 1
      });
      expect(result.current.step).toBe(1);
      expect(result.current.stepError).toContain(
        "outside the schedule time window",
      );
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text2: expect.stringContaining("outside the schedule time window"),
        }),
      );

      // Moving the fixed meal inside the window clears the error.
      act(() =>
        result.current.patch({
          meals: [
            {
              id: "m1",
              type: "lunch",
              durationMinutes: 45,
              placement: "fixed_time",
              fixedTime: new Date("2026-07-07T12:00:00"),
            },
          ],
        }),
      );
      expect(result.current.stepError).toBeUndefined();
      expect(Toast.hide).toHaveBeenCalled();
    });
  });

  describe("back navigation", () => {
    it("decrements the step when step > 0", async () => {
      const { result } = renderHook(() => useWizardForm());
      act(() => result.current.patch({ scheduleType: "personal" }));
      await act(async () => {
        await result.current.handleNext();
      });
      expect(result.current.step).toBe(1);

      act(() => result.current.handleBack());
      expect(result.current.step).toBe(0);
    });

    it("calls router.back() when already on step 0", () => {
      const { result } = renderHook(() => useWizardForm());
      act(() => result.current.handleBack());
      expect(mockRouterBack).toHaveBeenCalled();
    });
  });
});
