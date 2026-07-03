export type ScheduleType = "personal" | "event" | null;
export type BreakFrequency =
  | "few-long"
  | "balanced"
  | "many-short"
  | "none"
  | null;
export type AppointmentType = "work" | "school" | "medical" | "custom";
export type EventType =
  | "birthday"
  | "wedding"
  | "conference"
  | "concert"
  | "other"
  | null;

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MealPlacement =
  | "flexible"
  | "anchor_first"
  | "anchor_last"
  | "fixed_time";

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

export interface Meals {
  id: string;
  type: MealType;
  durationMinutes: number;
  placement: MealPlacement;
  fixedTime?: Date;
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

export interface NewScheduleFormState {
  scheduleType: ScheduleType;
  // Time window
  startTime: Date;
  endTime: Date;
  showStartPicker: boolean;
  showEndPicker: boolean;
  // Personal: appointments
  appointments: Appointment[];
  meals: Meals[];
  // Personal: breaks
  breakFrequency: BreakFrequency;
  // Personal: priority focus (required text + optional duration)
  priorityFocusText: string;
  priorityDurationMinutes: number | null;
  // Event details
  eventType: EventType;
  eventOtherLabel: string;
  // Event: schedule items
  eventScheduleItems: EventScheduleItem[];
}
