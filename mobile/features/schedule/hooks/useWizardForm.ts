import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { NewScheduleFormState } from "@/type/NewScheduleTypes";
import { defaultForm } from "../utils/wizardHelpers";
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
import { useWizardValidation } from "./useScheduleFormValidator";
import useEventItems from "./form/useEventItems";

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

  const {
    validator,
    conflictValidator,
    fixedScheduleDuration,
    validation,
    stepError,
  } = useWizardValidation({ form, step, isEvent });

  const patch = (p: Partial<NewScheduleFormState>) =>
    setForm((prev) => ({ ...prev, ...p }));

  const mealsState = useMeals({ form, setForm, step });
  const apptState = useAppointments({ form, setForm });
  const eventItemsState = useEventItems({ form, setForm });

  const showStepErrorToast = (message: string) => {
    Toast.show({
      type: "error",
      text1: "Invalid Input",
      text2: message,
      position: "top",
    });
  };

  useEffect(() => {
    if (form.scheduleType === null || step === 0) return;

    if (stepError) {
      showStepErrorToast(stepError);
    } else {
      Toast.hide();
    }
  }, [validation, step]);

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
    if (!canProceed()) return;

    if (stepError) {
      showStepErrorToast(stepError);
      return;
    }

    if (apptState.apptDraft.visible) apptState.hideDraft();
    if (eventItemsState.eventItemDraft.visible) eventItemsState.hideDraft();
    if (isLastStep()) {
      const { systemInstruction, prompt } = WizardPromptBuilder.build(form);

      router.replace("/schedule/generation");

      console.log(
        "generated schedule, this is the system prompt: ",
        systemInstruction,
        " and this is the prompt: ",
        prompt,
      );

      // await AIService?.generateSchedule(prompt, systemInstruction);
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
    isEvent,
    totalSteps,
    patch,
    isLastStep,
    canProceed,
    handleNext,
    handleBack,
    mealsState,
    apptState,
    eventItemsState,
    validator,
    stepError,
    fixedScheduleDuration,
  };
}
