import {
  Appointment,
  BreakFrequency,
  EventType,
  NewScheduleFormState,
} from "@/type/NewScheduleTypes";
import { TimeFormatter } from "@/utils/TimeFormatter";

// ─── Break frequency → natural language instruction ───────────────────────────
const BREAK_FREQUENCY_INSTRUCTIONS: Record<
  Exclude<BreakFrequency, null>,
  string
> = {
  "few-long":
    "Schedule 1–2 extended breaks spread across the day. Avoid frequent interruptions — the user prefers to work in long, uninterrupted stretches.",
  balanced:
    "Distribute breaks evenly throughout the day. Aim for a short break, plus a longer midday break.",
  "many-short":
    "Insert frequent micro-breaks to keep the user consistently fresh rather than running long sessions.",
  none: "Do NOT schedule any breaks. The user wants uninterrupted flow from start to finish. Only include meals if they fall within the time window.",
};

// ─── Meal placement → natural language instruction ────────────────────────────
const MEAL_PLACEMENT_INSTRUCTIONS: Record<string, (label: string) => string> = {
  flexible: (label) =>
    `Place "${label}" at a natural, sensible time within the window.`,
  anchor_first: (label) =>
    `Anchor "${label}" at or near the very start of the schedule window.`,
  anchor_last: (label) =>
    `Anchor "${label}" at or near the very end of the schedule window.`,
  fixed_time: (label) =>
    `Lock "${label}" to its specified fixed time — never move it.`,
};

// ─── Event type → system guidance + display label ─────────────────────────────
const EVENT_TYPE_INSTRUCTIONS: Record<
  Exclude<EventType, null>,
  { system: string; label: string }
> = {
  birthday: {
    label: "Birthday",
    system:
      "This is a birthday celebration. Favor a festive, social flow with arrivals, the main celebration, food, and relaxed mingling.",
  },
  wedding: {
    label: "Wedding",
    system:
      "This is a wedding. Follow a formal, sequential ceremony → reception → celebration flow, keeping the key moments in order.",
  },
  conference: {
    label: "Conference",
    system:
      "This is a conference. Keep a professional cadence with sessions, breaks between talks, and meals at predictable times.",
  },
  concert: {
    label: "Concert",
    system:
      "This is a concert. Lead with doors/arrival, the performance as the centerpiece, and a wind-down after.",
  },
  other: {
    label: "Event",
    system:
      "This is a custom event. Pace it sensibly around the segments the user provided.",
  },
};

export type BuiltPrompt = {
  /** Model guidance for this schedule type: how it should reason + format. */
  systemInstruction: string;
  /** The data-driven prompt built from the wizard form input. */
  prompt: string;
};

/**
 * A compact rules block used when embedding scheduler rules into other prompts
 * (e.g. the schedule-edit flow in editSchedulePromptGenerator).
 */
export const rulesJsonPrompt: string = [
  'Prefer returning the schedule as "fixed_appointments" with explicit "HH:MM" start/end times.',
  'Keep "preferences.day_start" and "preferences.day_end" aligned to the schedule window.',
  "Never overlap fixed appointments or fixed meals.",
].join("\n");

// ─── Appointment label helper ─────────────────────────────────────────────────
function appointmentLabel(appt: Appointment): string {
  if (appt.type === "custom") return appt.customLabel || "Custom Appointment";
  return (
    {
      work: "Work",
      school: "School / Class",
      medical: "Medical Appointment",
    }[appt.type] ?? appt.type
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
  /**
   * A compact rules block (used when embedding scheduler rules into other
   * prompts, e.g. the schedule-edit flow). See the `rulesJsonPrompt` export.
   */
  public static rulesJsonPrompt: string = rulesJsonPrompt;

  public static build(state: NewScheduleFormState): BuiltPrompt {
    if (state.scheduleType === "personal") {
      return this.buildPersonalPrompt(state);
    }
    if (state.scheduleType === "event") {
      return this.buildEventPrompt(state);
    }
    throw new Error("scheduleType must be set before building a prompt.");
  }

  // ─── PERSONAL ──────────────────────────────────────────────────────────────
  private static buildPersonalPrompt(state: NewScheduleFormState): BuiltPrompt {
    const wake = TimeFormatter.formatTime(state.startTime);
    const sleep = TimeFormatter.formatTime(state.endTime);
    const totalMins = TimeFormatter.getDurationMins(
      state.startTime,
      state.endTime,
    );

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
        const start = TimeFormatter.formatTime(appt.startTime);
        const end = TimeFormatter.formatTime(appt.endTime);
        const dur = TimeFormatter.getDurationMins(appt.startTime, appt.endTime);
        lines.push(
          `  • ${appointmentLabel(appt)}: ${start} – ${end} (${dur} min)`,
        );
      }
    }

    // ── Meals (flexible / anchored / fixed) ─────────────────────────────────
    if (state.meals.length > 0) {
      lines.push("\nMeals (honor each placement rule):");
      for (const meal of state.meals) {
        const placement = meal.placement ?? "flexible";
        const label = meal.type.charAt(0).toUpperCase() + meal.type.slice(1);
        const fixed =
          meal.placement === "fixed_time" && meal.fixedTime
            ? ` at ${TimeFormatter.formatTime(meal.fixedTime)}`
            : "";
        lines.push(
          `  • ${label}: ${meal.durationMinutes} min${fixed} — ${MEAL_PLACEMENT_INSTRUCTIONS[placement](label)}`,
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

    return {
      systemInstruction: PERSONAL_SYSTEM_INSTRUCTION,
      prompt: lines.join("\n"),
    };
  }

  // ─── EVENT ─────────────────────────────────────────────────────────────────
  private static buildEventPrompt(state: NewScheduleFormState): BuiltPrompt {
    const start = TimeFormatter.formatTime(state.startTime);
    const end = TimeFormatter.formatTime(state.endTime);
    const totalMins = TimeFormatter.getDurationMins(
      state.startTime,
      state.endTime,
    );

    const eventKey = state.eventType ?? "other";
    const eventInfo =
      EVENT_TYPE_INSTRUCTIONS[eventKey] ?? EVENT_TYPE_INSTRUCTIONS.other;
    const eventLabel =
      state.eventType === "other"
        ? state.eventOtherLabel || eventInfo.label
        : eventInfo.label;

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
        const durPart =
          item.durationMinutes != null
            ? ` (~${formatDurationMins(item.durationMinutes)})`
            : "";

        const fixedPart =
          item.isFixedTime && item.fixedTime
            ? ` — fixed at ${TimeFormatter.formatTime(item.fixedTime)}, do not move`
            : "";

        lines.push(`  • ${item.name}${durPart}${fixedPart}`);
      }
      lines.push(
        "Fill any remaining time naturally with transitions, mingling, or rest appropriate for this event type. Never move segments marked as fixed time.",
      );
    } else {
      lines.push(
        `Generate a complete, well-paced program for a ${eventLabel} event within the given time window.`,
      );
    }
    const systemInstruction = [
      EVENT_BASE_SYSTEM_INSTRUCTION,
      eventInfo.system,
    ].join("\n\n");

    return {
      systemInstruction,
      prompt: lines.join("\n"),
    };
  }
}

// ─── System instructions ──────────────────────────────────────────────────────
// Shared scheduling rules (mirror the wizard validators).
const SHARED_SYSTEM_INSTRUCTION = `You are Briqon, a specialized AI assistant that generates schedules.

Scheduling rules (these mirror the validated form input — never violate them):
1. Never overlap or move fixed appointments or fixed meals.
2. Stay strictly within the schedule window.
3. Honor the requested priority focus and any requested duration.
4. Place flexible/anchored meals and breaks around fixed commitments, respecting each placement rule.
5. Adjust break duration and placement based on remaining available time.
6. Maintain a realistic human schedule.

Output rules:
- Use 24-hour format (HH:MM).
- Return ONLY valid JSON.
- Do not include markdown or explanations outside JSON.
Format:
{
  "summary": {
    "categories": [
      {
        "name": "string",
        "total": "string",
        "sub_activities": [
          {
            "name": "string",
            "total": "string",
          }
        ]
      }
    ]
  },
  "schedule": [
    {
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "activity": "string"
    }
  ]
}


SUMMARY FORMAT:
"summary" is an object whose "categories" array totals the time per category, computed from the schedule.
- Group blocks into categories inferred from their "activity".
- "total" is its "X hr Y min" display.
- If a category has distinct sub-activities, list each under "sub_activities" with the same shape;
- Verify every total equals the sum of its blocks.
`;

const PERSONAL_SYSTEM_INSTRUCTION = `${SHARED_SYSTEM_INSTRUCTION}

This is a PERSONAL daily schedule. Prioritize the user's stated priority focus, weave in meals and breaks around fixed appointments, and fill remaining time with activities that serve the focus.`;

const EVENT_BASE_SYSTEM_INSTRUCTION = `${SHARED_SYSTEM_INSTRUCTION}

This is an EVENT program. Treat the provided segments as the backbone of the schedule and place them in the given order; only generate connective transitions for the remaining time.`;
