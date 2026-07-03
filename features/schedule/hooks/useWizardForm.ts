import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
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
import ScheduleRuleEngine from "../utils/ScheduleRuleEngine";
import useMeals from "./useMeals";
import useAppointments from "./useAppointments";

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

  const scheduleRulesValidator = useMemo(() => {
    return new ScheduleRuleEngine(form);
  }, [form]);

  const [eventItemDraft, setEventItemDraft] = useState<EventItemDraft>(
    defaultEventItemDraft(),
  );

  const isEvent = form.scheduleType === "event";
  const totalSteps = isEvent ? EVENT_TOTAL_STEPS : PERSONAL_TOTAL_STEPS;

  const patch = (p: Partial<NewScheduleFormState>) =>
    setForm((prev) => ({ ...prev, ...p }));
  const patchEventItem = (p: Partial<EventItemDraft>) =>
    setEventItemDraft((prev) => ({ ...prev, ...p }));

  const mealsState = useMeals({ form, setForm });
  const apptState = useAppointments({ form, setForm });

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
      if (step === 1) return true;
      if (step === 2) return form.breakFrequency !== null;
      if (step === 3) return !!form.priorityFocusText?.trim().length;
    }
    return false;
  };

  const handleNext = async () => {
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
  };
}
