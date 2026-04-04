import { Ionicons } from "@expo/vector-icons";
import {
  BreakFrequency,
  PriorityFocus,
  AppointmentType,
  EventType,
} from "@/type/NewScheduleTypes";

export const BREAK_FREQUENCY_OPTIONS: {
  key: Exclude<BreakFrequency, null>;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  desc: string;
  color: string;
}[] = [
  {
    key: "few-long",
    label: "Few Long Breaks",
    icon: "battery-charging-outline",
    desc: "1-2 extended rest periods to fully recharge",
    color: "#1FD8A0",
  },
  {
    key: "balanced",
    label: "Balanced",
    icon: "git-branch-outline",
    desc: "Regular breaks evenly spread throughout the day",
    color: "#7B6FFF",
  },
  {
    key: "many-short",
    label: "Many Short Breaks",
    icon: "flash-outline",
    desc: "Frequent micro-breaks to stay consistently fresh",
    color: "#5BB8FF",
  },
];

export const PRIORITY_OPTIONS: {
  key: Exclude<PriorityFocus, null>;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  desc: string;
  color: string;
}[] = [
  {
    key: "productivity",
    label: "Productivity",
    icon: "rocket-outline",
    desc: "Focused on output, tasks & deep work",
    color: "#7B6FFF",
  },
  {
    key: "socializing",
    label: "Socializing",
    icon: "people-outline",
    desc: "People-centered, networking & connection",
    color: "#5BB8FF",
  },
  {
    key: "rest",
    label: "Rest & Recovery",
    icon: "moon-outline",
    desc: "Recharge, unwind & restore energy",
    color: "#1FD8A0",
  },
];

export const APPOINTMENT_TYPES: {
  key: AppointmentType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "work", label: "Work", icon: "briefcase-outline" },
  { key: "school", label: "School", icon: "school-outline" },
  { key: "medical", label: "Medical", icon: "medkit-outline" },
  { key: "custom", label: "Custom", icon: "create-outline" },
];

export const EVENT_TYPES: {
  key: Exclude<EventType, null>;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  {
    key: "birthday",
    label: "Birthday",
    icon: "gift-outline",
    color: "#FF6B9D",
  },
  { key: "wedding", label: "Wedding", icon: "heart-outline", color: "#FF8C42" },
  {
    key: "conference",
    label: "Conference",
    icon: "business-outline",
    color: "#7B6FFF",
  },
  {
    key: "concert",
    label: "Concert",
    icon: "musical-notes-outline",
    color: "#5BB8FF",
  },
  {
    key: "other",
    label: "Other",
    icon: "ellipsis-horizontal-outline",
    color: "#1FD8A0",
  },
];

export const PERSONAL_STEP_LABELS = ["Type", "Time", "Breaks", "Priority"];
export const EVENT_STEP_LABELS = ["Type", "Details", "Time"];
export const PERSONAL_TOTAL_STEPS = 4;
export const EVENT_TOTAL_STEPS = 3;
