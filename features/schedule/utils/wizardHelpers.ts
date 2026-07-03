import {
  AppointmentDraft,
  EventItemDraft,
  NewScheduleFormState,
  Appointment,
} from "@/type/NewScheduleTypes";
import { APPOINTMENT_TYPES } from "../contants/wizardOptions";

export function defaultAppointmentDraft(): AppointmentDraft {
  const s = new Date();
  s.setHours(9, 0, 0, 0);
  const e = new Date();
  e.setHours(10, 0, 0, 0);
  return {
    visible: false,
    type: "work",
    customLabel: "",
    startTime: s,
    endTime: e,
    showStartPicker: false,
    showEndPicker: false,
  };
}

export function defaultEventItemDraft(): EventItemDraft {
  return { visible: false, name: "", duration: "" };
}

export function defaultForm(): NewScheduleFormState {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  return {
    scheduleType: null,
    startTime: start,
    endTime: end,
    showStartPicker: false,
    showEndPicker: false,
    appointments: [],
    breakFrequency: null,
    priorityFocus: null,
    productivityName: "",
    eventType: null,
    eventOtherLabel: "",
    eventScheduleItems: [],
  };
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function getDurationMins(start: Date, end: Date) {
  let endTime = end.getTime();

  if (endTime <= start.getTime()) {
    endTime += 24 * 60 * 60 * 1000;
  }

  return (endTime - start.getTime()) / 60000;
}

export function appointmentLabel(appt: Appointment): string {
  if (appt.type === "custom" && appt.customLabel.trim())
    return appt.customLabel.trim();
  return APPOINTMENT_TYPES.find((t) => t.key === appt.type)?.label ?? appt.type;
}

export function durationText(start: Date, end: Date): string {
  const diff = getDurationMins(start, end);
  if (diff <= 0) return "End time should be after start";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `Duration: ${h > 0 ? `${h}h ` : ""}${m > 0 ? `${m}m` : ""}`;
}
