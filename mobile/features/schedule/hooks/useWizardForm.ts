import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  FormState,
  AppointmentDraft,
  EventItemDraft,
  Appointment,
  EventScheduleItem,
} from "@/type/NewScheduleTypes";
import {
  defaultForm,
  defaultAppointmentDraft,
  defaultEventItemDraft,
  buildPrompt,
} from "../utils/wizardHelpers";
import {
  EVENT_TOTAL_STEPS,
  PERSONAL_TOTAL_STEPS,
} from "../contants/wizardOptions";
import { useSchedule } from "@/context/ScheduleContext";

export function useWizardForm() {
  const router = useRouter();
  const {
    handleScheduleGeneration,
    prevScheduleForm,

    setPrevScheduleFormInput,
  } = useSchedule();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [apptDraft, setApptDraft] = useState<AppointmentDraft>(
    defaultAppointmentDraft(),
  );
  const [eventItemDraft, setEventItemDraft] = useState<EventItemDraft>(
    defaultEventItemDraft(),
  );

  const isEvent = form.scheduleType === "event";
  const totalSteps = isEvent ? EVENT_TOTAL_STEPS : PERSONAL_TOTAL_STEPS;

  useEffect(() => {
    // if there is a valud in this state then the form renders because of the error response from the api caller

    if (prevScheduleForm !== undefined) {
      setForm(prevScheduleForm);
      setStep(prevScheduleForm.scheduleType === "event" ? 2 : 3);
    }
  }, [prevScheduleForm]);

  const patch = (p: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...p }));
  const patchAppt = (p: Partial<AppointmentDraft>) =>
    setApptDraft((prev) => ({ ...prev, ...p }));
  const patchEventItem = (p: Partial<EventItemDraft>) =>
    setEventItemDraft((prev) => ({ ...prev, ...p }));

  // ── Appointments ────────────────────────────────────────────────────────────
  const commitAppointment = () => {
    if (!apptDraft.visible) return;

    const appt: Appointment = {
      id: Date.now().toString(),
      type: apptDraft.type,
      customLabel: apptDraft.customLabel,
      startTime: apptDraft.startTime,
      endTime: apptDraft.endTime,
    };
    patch({ appointments: [...form.appointments, appt] });
    setApptDraft(defaultAppointmentDraft());
  };
  const removeAppointment = (id: string) =>
    patch({ appointments: form.appointments.filter((a) => a.id !== id) });

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
    'Generate a schedule based on this event:Start: 10:00End: 03:00Event type: weddingActivities:STRICT RULES:- Follow the appointments or activities if specify.- Output ONLY JSON- No explanation- Follow this schema EXACTLY:{  "start_time": "HH:MM",  "end_time": "HH:MM",  "activity": "string"}  ';
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
      if (step === 3) return form.priorityFocus !== null;
    }
    return false;
  };

  const handleNext = () => {
    if (apptDraft.visible) setApptDraft((d) => ({ ...d, visible: false }));
    if (eventItemDraft.visible)
      setEventItemDraft((d) => ({ ...d, visible: false }));
    if (isLastStep()) {
      const generatedPromp = buildPrompt(form);

      setPrevScheduleFormInput(form);

      handleScheduleGeneration(generatedPromp, true);

      router.push("/schedule/schedule-conversation");
    } else setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else router.back();
  };

  return {
    step,
    form,
    apptDraft,
    eventItemDraft,
    isEvent,
    totalSteps,
    patch,
    patchAppt,
    patchEventItem,
    commitAppointment,
    removeAppointment,
    commitEventItem,
    removeEventItem,
    isLastStep,
    canProceed,
    handleNext,
    handleBack,
  };
}
