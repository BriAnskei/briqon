import { initLlama, LlamaContext } from "llama.rn";
import { ModelManager } from "../ai/ModelManager";
import { ScheduleItem } from "@/type/MessageTypes";
import {
  FixedAppointment,
  FlexibleTask,
  ScheduleEngine,
} from "./ScheduleEngine";

type PlanItem = {
  activity: string;
  duration_minutes: number;
};

const SYSTEM_PROMPT = `
You are Briqon.

You are a schedule planning assistant.

Your task is to create a realistic activity plan.

Rules:
- Generate activities only.
- Do NOT generate timestamps.
- Do NOT calculate clock times.
- Do NOT explain your reasoning.
- Respect appointments when deciding how much activity is reasonable.
- Respect the user's focus and break preference.
- Durations must be positive integers in minutes.
- Use a small number of activities when break preference is "few-long".
- Use a balanced number of activities when break preference is "balanced".
- Use many shorter activities when break preference is "many-short".
- Activity names should be concise.
- Activity names must be unique within the plan.
- Do not repeat the same activity name.
- Return valid JSON only.

Response format:

{
  "activities": [
    {
      "activity": "Activity Name",
      "duration_minutes": 60
    }
  ]
}`.trim();

import { z } from "zod";

export const PlanActivitySchema = z.object({
  activity: z.string().min(1),
  duration_minutes: z.number().int().positive(),
});

export const PlanResponseSchema = z.object({
  activities: z.array(PlanActivitySchema).min(1),
});

export class AIService {
  private context: LlamaContext | undefined;

  /** Initialise the on‑device LLM if it hasn't been created yet. */
  async initialize(onProgress?: (percent: number) => void) {
    if (this.context) return;

    const modelPath = (await ModelManager.ensureModel(onProgress)).replace(
      "file://",
      "",
    );

    this.context = await initLlama({
      model: modelPath,
      n_ctx: 4096,
      n_gpu_layers: 0,
      use_mlock: true,
      use_mmap: true,
    });
  }

  isInitialized() {
    return !!this.context;
  }

  /** Simple temperature picker based on break preference. */
  private getTemperature(breakPref?: string): number {
    const map: Record<string, number> = {
      "few-long": 0.45,
      balanced: 0.55,
      "many-short": 0.65,
    };
    return map[breakPref ?? "balanced"] ?? 0.5;
  }

  /**
   * Core helper that asks the model, validates the JSON, and, if needed, re‑asks
   * until the total activity minutes are within the tolerance of the free time.
   */
  private async askModelWithFillLoop(
    basePrompt: string,
    temperature: number,
    targetFreeMins: number | undefined,
    tolerance = 30,
    maxRetries = 3,
  ): Promise<PlanItem[]> {
    // Build up a running conversation history instead of replacing the prompt
    const messages: {
      role: "system" | "user" | "assistant";
      content: string;
    }[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: basePrompt },
    ];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const res = await this.context!.completion({
        messages,
        temperature,
        top_p: 0.9,
      });

      let activities: PlanItem[];
      try {
        const parsed = JSON.parse(res.content);
        const validated = PlanResponseSchema.parse(parsed);
        activities = validated.activities;
      } catch {
        // Malformed response — push it as assistant turn and ask to retry
        messages.push({ role: "assistant", content: res.content });
        messages.push({
          role: "user",
          content:
            "Your response was not valid JSON. Return ONLY a valid JSON object in the specified format.",
        });
        continue;
      }

      const totalActivityMins = activities.reduce(
        (s, a) => s + a.duration_minutes,
        0,
      );

      if (
        targetFreeMins === undefined ||
        Math.abs(totalActivityMins - targetFreeMins) <= tolerance
      ) {
        return activities;
      }

      // Push assistant's answer and a correction request into the conversation
      messages.push({ role: "assistant", content: res.content });

      const missing = targetFreeMins - totalActivityMins;
      const direction = missing > 0 ? "short" : "over";
      const absMissing = Math.abs(missing);

      messages.push({
        role: "user",
        content: `Your list totals ${totalActivityMins} minutes, which is ${absMissing} minutes ${direction} of the required ${targetFreeMins} minutes (±${tolerance} tolerance). Adjust the durations or add/remove activities so the total lands within that range. Return ONLY the full corrected JSON object.`,
      });
    }

    // Exhausted retries — fall back to a clean single-shot with base prompt
    const fallback = await this.context!.completion({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: basePrompt },
      ],
      temperature,
      top_p: 0.9,
    });
    const parsed = JSON.parse(fallback.content);
    const validated = PlanResponseSchema.parse(parsed);
    return validated.activities;
  }

  /**
   * Public entry‑point used by the UI. It builds the schedule, handling the
   * fill‑the‑gap loop and delegating the final ordering to ScheduleEngine.
   */
  async generateScheduleJSON(
    prompt: string,
    startTime: string,
    endTime: string,
    appointments: any[],
    scheduleType?: string,
    breakFrequency?: string,
    targetFreeMins?: number,
  ): Promise<ScheduleItem[]> {
    if (!this.context) {
      throw new Error("Model not initialized");
    }

    const temperature = this.getTemperature(breakFrequency);

    // Optional: style‑aware tolerance (can be tuned later)
    const toleranceByStyle: Record<string, number> = {
      "few-long": 45,
      balanced: 30,
      "many-short": 15,
    };
    const tolerance = toleranceByStyle[breakFrequency ?? "balanced"] ?? 30;

    const activities = await this.askModelWithFillLoop(
      prompt,
      temperature,
      targetFreeMins,
      tolerance,
    );

    // Convert UI appointments to FixedAppointments (same as before)
    const fixedAppointments: FixedAppointment[] = appointments.map((appt) => {
      const fmt = (date: Date) =>
        date.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      const label =
        appt.type === "custom" && appt.customLabel
          ? appt.customLabel.trim()
          : appt.type;
      return {
        activity: label,
        start_time: fmt(new Date(appt.startTime)),
        end_time: fmt(new Date(appt.endTime)),
      };
    });

    const flexibleTasks: FlexibleTask[] = activities.map((act) => ({
      activity: act.activity,
      duration_minutes: act.duration_minutes,
    }));

    const schedule = ScheduleEngine.compileSchedule(
      startTime,
      endTime,
      fixedAppointments,
      flexibleTasks,
      scheduleType,
      breakFrequency ?? "balanced",
    );

    console.log("Generated schedule with meals and breaks: ", schedule);
    return schedule;
  }
}
