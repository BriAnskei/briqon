export type ScheduleType = "personal" | "event" | null;
export type PriorityFocus =
  | "productivity"
  | "socializing"
  | "rest and recovery"
  | null;
export type BreakFrequency = "few-long" | "balanced" | "many-short" | null;
export type AppointmentType = "work" | "school" | "medical" | "custom";
export type EventType =
  | "birthday"
  | "wedding"
  | "conference"
  | "concert"
  | "other"
  | null;

export interface Appointment {
  id: string;
  type: AppointmentType;
  customLabel: string;
  startTime: Date;
  endTime: Date;
}

export interface AppointmentDraft {
  visible: boolean;
  type: AppointmentType;
  customLabel: string;
  startTime: Date;
  endTime: Date;
  showStartPicker: boolean;
  showEndPicker: boolean;
}

export interface EventScheduleItem {
  id: string;
  name: string;
  duration: string; // free-text, optional e.g. "30 min", "1 hr"
}

export interface EventItemDraft {
  visible: boolean;
  name: string;
  duration: string;
}

export interface FormState {
  scheduleType: ScheduleType;
  // Time window
  startTime: Date;
  endTime: Date;
  showStartPicker: boolean;
  showEndPicker: boolean;
  // Personal: appointments
  appointments: Appointment[];
  // Personal: breaks
  breakFrequency: BreakFrequency;
  // Personal: priority
  priorityFocus: PriorityFocus;
  productivityName: string;
  // Event details
  eventType: EventType;
  eventOtherLabel: string;
  // Event: schedule items
  eventScheduleItems: EventScheduleItem[];
}
