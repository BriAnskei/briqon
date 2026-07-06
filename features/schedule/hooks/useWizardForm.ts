import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import {
  NewScheduleFormState,
  EventItemDraft,
  EventScheduleItem,
} from "@/type/NewScheduleTypes";
import { defaultForm, defaultEventItemDraft } from "../utils/wizardHelpers";
import {
  EVENT_TOTAL_STEPS,
  PERSONAL_TOTAL_STEPS,
} from "../contants/wizardOptions";
import { useSchedule } from "@/context/ScheduleContext";
import { WizardPromptBuilder } from "../utils/WizardPromptBuilder";
import { useAI } from "@/context/AIContext";
import useMeals from "./useMeals";
import useAppointments from "./useAppointments";
import ScheduleFormWindowtimeRuleValidator from "../utils/ScheduleFormWindowtimeRuleValidator";

export type FixedScheduleDuration = {
  appMinutes: number;
  mealMinutes: number;
  overAllMinutes: number;
};

export function useWizardForm() {
  const router = useRouter();

  const {
    handleScheduleGeneration,
    prevScheduleForm,
    setPrevScheduleFormInput,
  } = useSchedule();

  const { service: AIService } = useAI();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<NewScheduleFormState>(defaultForm());

  // moved above validation/stepError — was previously declared after
  // stepError's useMemo, which referenced it before initialization (TDZ bug)
  const isEvent = form.scheduleType === "event";
  const totalSteps = isEvent ? EVENT_TOTAL_STEPS : PERSONAL_TOTAL_STEPS;

  const validator = useMemo(
    () => new ScheduleFormWindowtimeRuleValidator(form),
    [form],
  );

  const fixedScheduleDuration: FixedScheduleDuration = {
    appMinutes: validator.getAppointmentsTotalMinutes() ?? 0,
    mealMinutes: validator.getMealsTotalMinutes() ?? 0,
    overAllMinutes: validator.getPersonalOverallMinutes() ?? 0,
  };

  const validation = useMemo(() => {
    let appointments = validator.validateAppWindowTime();
    let meals = validator.validateMealWindowTime();
    let breaks = validator.validateBreakFreqWindow();
    let priorityTime = validator.validatePriorityTimeWindow();
    let windowTime = validator.validateWindowMinDuration();

    const isAllValid = [
      appointments,
      meals,
      breaks,
      priorityTime,
      windowTime,
    ].every((d) => d.valid);

    return {
      isAllValid,
      appointments,
      meals,
      breaks,
      priorityTime,
      windowTime,
    };
  }, [validator]);

  const stepError = useMemo(() => {
    if (isEvent || validation.isAllValid) return undefined;
    if (step === 1)
      return (
        (!validation.appointments.valid && validation.appointments.message) ||
        (!validation.meals.valid && validation.meals.message) ||
        undefined
      );
    if (step === 2)
      return !validation.breaks.valid ? validation.breaks.message : undefined;
    if (step === 3)
      return !validation.priorityTime.valid
        ? validation.priorityTime.message
        : undefined;
    return undefined;
  }, [validation, step, isEvent]);

  const [eventItemDraft, setEventItemDraft] = useState<EventItemDraft>(
    defaultEventItemDraft(),
  );

  const patch = (p: Partial<NewScheduleFormState>) =>
    setForm((prev) => ({ ...prev, ...p }));
  const patchEventItem = (p: Partial<EventItemDraft>) =>
    setEventItemDraft((prev) => ({ ...prev, ...p }));

  const mealsState = useMeals({ form, setForm });
  const apptState = useAppointments({ form, setForm });

  // ── Step-error toast tracking ────────────────────────────────────────────
  // A step only starts "live" toasting once the user has attempted to
  // continue past it while invalid. Before that, we stay quiet so we're not
  // yelling at someone who's still mid-input.
  const [attemptedSteps, setAttemptedSteps] = useState<Set<number>>(new Set());

  const showStepErrorToast = (message: string) => {
    Toast.show({
      type: "error",
      text1: "Invalid Input",
      text2: message,
      position: "top",
    });
  };

  useEffect(() => {
    if (!attemptedSteps.has(step)) return;

    if (stepError) {
      showStepErrorToast(stepError);
    } else {
      Toast.hide();
    }
  }, [stepError, step, attemptedSteps]);

  // ── Event items ─────────────────────────────────────────────────────────────
  const commitEventItem = () => {
    if (!eventItemDraft.visible || !eventItemDraft.name.trim()) return;

    const item: EventScheduleItem = {
      id: Date.now().toString(),
      name: eventItemDraft.name.trim(),
      duration: eventItemDraft.duration.trim(),
    };
    patch({ eventScheduleItems: [...form.eventScheduleItems, item] });
    setEventItemDraft(defaultEventItemDraft());
  };
  const removeEventItem = (id: string) =>
    patch({
      eventScheduleItems: form.eventScheduleItems.filter((i) => i.id !== id),
    });

  // ── Navigation ──────────────────────────────────────────────────────────────
  const isLastStep = () => step === totalSteps - 1;

  const canProceed = (): boolean => {
    if (step === 0) return form.scheduleType !== null;
    if (isEvent) {
      if (step === 1)
        return (
          form.eventType !== null &&
          (form.eventType !== "other" || !!form.eventOtherLabel.trim())
        );
      if (step === 2) return true;
    } else {
      if (step === 1) {
        return true;
      }
      if (step === 2) return form.breakFrequency !== null;
      if (step === 3) return !!form.priorityFocusText?.trim().length;
    }
    return false;
  };

  const handleNext = async () => {
    if (stepError) {
      setAttemptedSteps((prev) => {
        if (prev.has(step)) return prev;
        const next = new Set(prev);
        next.add(step);
        return next;
      });
      showStepErrorToast(stepError);
      return;
    }

    if (apptState.apptDraft.visible) apptState.hideDraft();
    if (eventItemDraft.visible)
      setEventItemDraft((d) => ({ ...d, visible: false }));
    if (isLastStep()) {
      const generatedPromp = WizardPromptBuilder.build(form);

      console.log("generated schedule: ", generatedPromp);

      await AIService?.generateSchedule(generatedPromp);
    } else setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else router.back();
  };

  return {
    validation,
    step,
    form,
    eventItemDraft,
    isEvent,
    totalSteps,
    patch,
    patchEventItem,
    commitEventItem,
    removeEventItem,
    isLastStep,
    canProceed,
    handleNext,
    handleBack,
    mealsState,
    apptState,
    validator,
    stepError,
    fixedScheduleDuration,
  };
}
