import {
  Appointment,
  BreakFrequency,
  NewScheduleFormState,
} from "@/type/NewScheduleTypes";
import { formatTime, getDurationMins } from "./wizardHelpers";

// ─── Break frequency → natural language instruction ───────────────────────────
const BREAK_FREQUENCY_INSTRUCTIONS: Record<
  Exclude<BreakFrequency, null>,
  string
> = {
  "few-long":
    "Schedule 1–2 extended breaks spread across the day. Avoid frequent interruptions — the user prefers to work in long, uninterrupted stretches.",
  balanced:
    "Distribute breaks evenly throughout the day. Aim for a short break, plus a longer midday break",
  "many-short":
    "Insert frequent micro-breaks, Keep the user consistently fresh rather than running long sessions.",
  none: "Do NOT schedule any breaks. The user wants uninterrupted flow from start to finish. Only include meals if they fall within the time window.",
};

// ─── Appointment label helper ─────────────────────────────────────────────────
function appointmentLabel(appt: Appointment): string {
  if (appt.type === "custom") return appt.customLabel || "Custom Appointment";
  return (
    { work: "Work", school: "School / Class", medical: "Medical Appointment" }[
      appt.type
    ] ?? appt.type
  );
}

// ─── Minutes → "Xh Ym" label ──────────────────────────────────────────────────
function formatDurationMins(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hr${h !== 1 ? "s" : ""}`);
  if (m > 0) parts.push(`${m} min`);
  return parts.length > 0 ? parts.join(" ") : "0 min";
}

export class WizardPromptBuilder {
  public static build(state: NewScheduleFormState): string {
    if (state.scheduleType === "personal") {
      return this.buildPersonalPrompt(state);
    }
    if (state.scheduleType === "event") {
      return this.buildEventPrompt(state);
    }
    throw new Error("scheduleType must be set before building a prompt.");
  }

  // ─── PERSONAL ──────────────────────────────────────────────────────────────
  private static buildPersonalPrompt(state: NewScheduleFormState): string {
    const wake = formatTime(state.startTime);
    const sleep = formatTime(state.endTime);
    const totalMins = getDurationMins(state.startTime, state.endTime);

    const lines: string[] = [
      `Schedule window: ${wake} – ${sleep} (${totalMins} minutes total).`,
    ];

    // ── Priority focus (required text, optional duration) ───────────────────
    const focusText = state.priorityFocusText.trim();
    if (focusText) {
      lines.push(`\nPriority focus: ${focusText}`);

      if (
        state.priorityDurationMinutes != null &&
        state.priorityDurationMinutes > 0
      ) {
        lines.push(
          `Allocate approximately ${formatDurationMins(
            state.priorityDurationMinutes,
          )} total toward this focus across the schedule window.`,
        );
      } else {
        lines.push(
          "No specific duration was given for this focus — use your judgment to allocate an appropriate amount of time within the schedule window based on the other constraints.",
        );
      }

      lines.push(
        `Instruction: Fill free time with activities centered around "${focusText}". Treat this as the primary goal of the schedule, fitting it around any fixed appointments.`,
      );
    }

    // ── Fixed appointments ──────────────────────────────────────────────────
    if (state.appointments.length > 0) {
      lines.push("\nFixed appointments (block these times exactly):");
      for (const appt of state.appointments) {
        const start = formatTime(appt.startTime);
        const end = formatTime(appt.endTime);
        const dur = getDurationMins(appt.startTime, appt.endTime);
        lines.push(
          `  • ${appointmentLabel(appt)}: ${start} – ${end} (${dur} min)`,
        );
      }
    }

    // ── Break preference ────────────────────────────────────────────────────
    if (state.breakFrequency) {
      lines.push(
        `\nBreak preference: ${state.breakFrequency}`,
        `Instruction: ${BREAK_FREQUENCY_INSTRUCTIONS[state.breakFrequency]}`,
      );
    }

    lines.push(
      "\nGenerate a complete, chronological daily schedule following all constraints above.",
    );

    return lines.join("\n");
  }

  // ─── EVENT ─────────────────────────────────────────────────────────────────
  private static buildEventPrompt(state: NewScheduleFormState): string {
    const start = formatTime(state.startTime);
    const end = formatTime(state.endTime);
    const totalMins = getDurationMins(state.startTime, state.endTime);

    const eventLabel =
      state.eventType === "other"
        ? state.eventOtherLabel || "Event"
        : state.eventType
          ? state.eventType.charAt(0).toUpperCase() + state.eventType.slice(1)
          : "Event";

    const lines: string[] = [
      `Event type: ${eventLabel}`,
      `Event window: ${start} – ${end} (${totalMins} minutes total).`,
    ];

    // ── Event schedule items ────────────────────────────────────────────────
    if (state.eventScheduleItems.length > 0) {
      lines.push(
        "\nRequired event segments (fit these into the window in order):",
      );
      for (const item of state.eventScheduleItems) {
        const dur = item.duration ? ` (~${item.duration})` : "";
        lines.push(`  • ${item.name}${dur}`);
      }
      lines.push(
        "Fill any remaining time naturally with transitions, mingling, or rest appropriate for this event type.",
      );
    } else {
      lines.push(
        `Generate a complete, well-paced program for a ${eventLabel} event within the given time window.`,
      );
    }

    return lines.join("\n");
  }
}
