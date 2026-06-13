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

  async generateScheduleJSON(
    prompt: string,
    startTime: string,
    endTime: string,
    appointments: any[],
    scheduleType?: string,
  ): Promise<ScheduleItem[]> {
    if (!this.context) {
      throw new Error("Model not initialized");
    }

    const res = await this.context.completion({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      top_p: 0.9,
    });

    try {
      const parsed = JSON.parse(res.content);
      // Validate the shape of the model output using Zod
      const validated = PlanResponseSchema.parse(parsed);
      const activities: PlanItem[] = validated.activities;

      // 1. Convert UI appointments to FixedAppointments
      const fixedAppointments: FixedAppointment[] = appointments.map((appt) => {
        const formatTime = (date: Date) => {
          return date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        };
        const label =
          appt.type === "custom" && appt.customLabel
            ? appt.customLabel.trim()
            : appt.type;
        return {
          activity: label,
          start_time: formatTime(new Date(appt.startTime)),
          end_time: formatTime(new Date(appt.endTime)),
        };
      });

      // 2. Map the LLM activities to FlexibleTasks
      // This is what the ScheduleEngine will fit into the gaps
      const flexibleTasks: FlexibleTask[] = activities.map((act) => ({
        activity: act.activity,
        duration_minutes: act.duration_minutes,
      }));

      // 3. THIS IS THE KEY PART:
      // We pass everything into the ScheduleEngine.
      // It will:
      //   a) Run insertMeals() to add Breakfast, Lunch, and Dinner.
      //   b) Sequence your FlexibleTasks around these meals and appointments.
      //   c) Insert 15-minute breaks automatically.
      const schedule = ScheduleEngine.compileSchedule(
        startTime,
        endTime,
        fixedAppointments,
        flexibleTasks,
        scheduleType,
      );

      console.log("Generated schedule with meals and breaks: ", schedule);
      return schedule;
    } catch (error) {
      console.error("Error generating schedule json:", error);
      throw new Error("Invalid JSON or scheduling error");
    }
  }
}
