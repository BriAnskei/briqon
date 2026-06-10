import {
  AppointmentDraft,
  EventItemDraft,
  FormState,
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

export function defaultForm(): FormState {
  const start = new Date();
  start.setHours(6, 0, 0, 0);
  const end = new Date();
  end.setHours(18, 0, 0, 0);
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
  return (end.getTime() - start.getTime()) / 60000;
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

export const rulesJsonPrompt = `
STRICT RULES:
- Follow the appointments or activities if specify.
- Output ONLY JSON
- No explanation
- Follow this schema EXACTLY:


{
  "start_time": "HH:MM",
  "end_time": "HH:MM",
  "activity": "string"
}

`;

export function buildPrompt(form: FormState): string {
  const scheduleType = form.scheduleType;
  if (scheduleType !== "event" && scheduleType !== "personal")
    throw new Error("Invalid schedule type");

  if (form.scheduleType == "event") return generateEventSchedulePrompt(form);

  return generatePersonalSchedulePrompt(form);
}

function generateEventSchedulePrompt(form: FormState) {
  return `
Generate a schedule based on this event:

Start: ${formatTime(form.startTime)}
End: ${formatTime(form.endTime)}
Event type: ${form.eventType}

Activities:
${form.eventScheduleItems.map((i) => `- ${i.name} (${i.duration})`).join("\n")}


${rulesJsonPrompt}
  `;
}

function generatePersonalSchedulePrompt(form: FormState) {
  return `  
Generate a personal schedule for ${form.priorityFocus}:

Start: ${formatTime(form.startTime)}
End: ${formatTime(form.endTime)}
Focus: ${form.productivityName || form.priorityFocus}
Break style: ${getBreakFrequencyPrompt(form.breakFrequency!)}  


Appointments:
${form.appointments.map((a) => `- ${a.type} (${formatTime(a.startTime)} - ${formatTime(a.endTime)})`).join("\n")}

${rulesJsonPrompt}
  `;
}

/**
 * @returns break types description prompt based on the type
 */
function getBreakFrequencyPrompt(breakType: string) {
  const breakTypesPrompt: Record<string, string> = {
    "few-long":
      "Structure the schedule with a small number of time blocks, each covering longer continuous periods. Minimize fragmentation and group activities into extended sessions.",
    balanced:
      "Structure the schedule with a moderate number of time blocks, keeping a natural mix of longer and shorter activities. Maintain a steady rhythm between focus and variety",
    "many-short":
      "Structure the schedule with many smaller time blocks. Break activities into short, clearly separated segments to increase granularity and flexibility.",
  };

  return breakTypesPrompt[breakType];
}
