import { FormState, Appointment } from "@/type/NewScheduleTypes";
import { formatTime, getDurationMins } from "./wizardHelpers";

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

export class WizardPromptBuilder {
  /**
   * Builds the AI prompt from the given wizard form state.
   * @param form The current state of the wizard form.
   * @returns The generated prompt string.
   */
  public static build(form: FormState): string {
    console.log(form);
    console.log("____________________-");

    const scheduleType = form.scheduleType;
    if (scheduleType !== "event" && scheduleType !== "personal") {
      throw new Error("Invalid schedule type");
    }

    if (scheduleType === "event") {
      return this.generateEventSchedulePrompt(form);
    }

    return this.generatePersonalSchedulePrompt(form);
  }

  private static generateEventSchedulePrompt(form: FormState): string {
    return `
Create an event activity plan.

Available time:
${formatTime(form.startTime)} to ${formatTime(form.endTime)}

Event type:
${form.eventType}

Known activities:
${form.eventScheduleItems
  .map((i) => `- ${i.name} (${i.duration} minutes)`)
  .join("\n")}

Return only activities and duration_minutes.
`;
  }

  private static generatePersonalSchedulePrompt(form: FormState): string {
    const totalWindowMinutes = this.calculateTotalWindowMinutes(
      form.startTime,
      form.endTime,
    );
    const appointmentMinutes = this.calculateAppointmentMinutes(
      form.appointments,
    );
    const breakMinutes = this.estimateBreakMinutes(
      form.breakFrequency,
      totalWindowMinutes,
      appointmentMinutes,
    );
    const freeMinutes = totalWindowMinutes - appointmentMinutes - breakMinutes;

    return `
Create an activity plan.

Available time:
${formatTime(form.startTime)} to ${formatTime(form.endTime)}

Total window minutes: ${totalWindowMinutes}
Minutes reserved by appointments: ${appointmentMinutes}
Estimated break minutes (based on "${form.breakFrequency}" preference): ${breakMinutes}

**Free minutes that you must fill with activities: ${freeMinutes}**  // Aim for this total (±30 min tolerance).

Focus:
${form.productivityName || form.priorityFocus}

Break preference:
${form.breakFrequency}

Appointments:
${
  form.appointments.length
    ? form.appointments
        .map(
          (a) =>
            `- ${a.type} (${formatTime(a.startTime)} - ${formatTime(a.endTime)})`,
        )
        .join("\n")
    : "None"
}

**IMPORTANT:** Do NOT include meals (Breakfast, Lunch, Dinner) in the output – the system will add them automatically.

Return ONLY a JSON object in the following format (no extra text). The sum of all \`duration_minutes\` should be **between ${freeMinutes - 30} and ${freeMinutes + 30}** minutes.

\`\`\`json
{
  "activities": [
    { "activity": "Your activity name", "duration_minutes": 45 },
    { "activity": "Another activity", "duration_minutes": 30 }
  ]
}
\`\`\`
`.trim();
  }

  /**
   * Total minutes in the time window (ignoring appointments).
   */
  private static calculateTotalWindowMinutes(
    startTime: Date,
    endTime: Date,
  ): number {
    return getDurationMins(startTime, endTime);
  }

  private static calculateAppointmentMinutes(
    appointments: Appointment[],
  ): number {
    return appointments.reduce(
      (total, appt) => total + getDurationMins(appt.startTime, appt.endTime),
      0,
    );
  }

  /**
   * Rough estimate of how many minutes the deterministic engine will insert as breaks.
   * This is only used for prompting the model so it can aim for the correct total activity time.
   */
  private static estimateBreakMinutes(
    breakPref: string | null | undefined,
    totalWindowMins: number,
    appointmentMins: number,
  ): number {
    const freeMins = totalWindowMins - appointmentMins;
    switch (breakPref) {
      case "few-long":
        // Assume one 15 min break per ~90 min activity block
        return Math.floor(freeMins / 90) * 15;
      case "balanced":
        // One break per ~60 min block
        return Math.floor(freeMins / 60) * 15;
      case "many-short":
        // One break per ~30 min block
        return Math.floor(freeMins / 30) * 15;
      default:
        return Math.floor(freeMins / 60) * 15;
    }
  }

  /**
   * Expose the free-minutes value that the prompt mentions. Helpful for the UI when
   * we want to pass it to the AIService for the fill-the-gap loop.
   */
  static getFreeMinutes(form: FormState): number {
    const totalWindowMins = this.calculateTotalWindowMinutes(
      form.startTime,
      form.endTime,
    );
    const appointmentMins = this.calculateAppointmentMinutes(form.appointments);
    const breakMins = this.estimateBreakMinutes(
      form.breakFrequency,
      totalWindowMins,
      appointmentMins,
    );
    return totalWindowMins - appointmentMins - breakMins;
  }
}
