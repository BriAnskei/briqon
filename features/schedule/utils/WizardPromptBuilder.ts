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
    const totalAvailableMinutes = this.calculateTotalAvailableMinutes(
      form.startTime,
      form.endTime,
      form.appointments,
    );

    const appointmentMinutes = this.calculateAppointmentMinutes(
      form.appointments,
    );

    // NOTE: The AI **must not** generate meals (Breakfast, Lunch, Dinner). The ScheduleEngine will automatically insert those based on the personal schedule type.
    // This keeps the model focused on productive activities and lets the deterministic engine handle meal timing safely.
    // An example JSON response is provided at the end of this prompt.
    return `
Create an activity plan.

Available time:
${formatTime(form.startTime)} to ${formatTime(form.endTime)}

Total available minutes:
${totalAvailableMinutes}

Minutes reserved by appointments:
${appointmentMinutes}

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

Return ONLY a JSON object in the following format (no extra text):

{
  "activities": [
    { "activity": "Your activity name", "duration_minutes": 45 },
    { "activity": "Another activity", "duration_minutes": 30 }
  ]
}

`.trim();
  }

  private static calculateTotalAvailableMinutes(
    startTime: Date,
    endTime: Date,
    appointments: Appointment[],
  ): number {
    const totalWindowMinutes = getDurationMins(startTime, endTime);
    const appointmentMinutes = this.calculateAppointmentMinutes(appointments);
    return totalWindowMinutes - appointmentMinutes;
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
   * @returns break types description prompt based on the type
   */
  private static getBreakFrequencyPrompt(breakType: string): string {
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
}
