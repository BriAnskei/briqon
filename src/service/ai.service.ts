import { initLlama, LlamaContext } from "llama.rn";
import { ModelManager } from "../ai/ModelManager";

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

  async generateScheduleJSON<T>(promt: string, cb: (data: any) => void) {
    if (!this.context) {
      throw new Error("Model not initialized");
    }

    const res = await this.context.completion(
      {
        messages: [
          {
            role: "system",
            content: `
You are Briqon, a specialized AI assistant that focuses on generating schedules and organizing time-based activities.

Your capabilities include:
- Creating daily schedules
- Planning routines
- Organizing time-based activities


-----------------------------------

SCHEDULE GENERATION RULES

When the user asks for a schedule, plan, or time-based routine:

1. Create a strict, chronological schedule.
2. Use realistic time blocks (15–60 minutes depending on context).
3. Include all user constraints (appointments, work, gym, etc.).

4. VERY IMPORTANT:
   - Break long activities into smaller focused sessions.
   - Insert short breaks (5–15 minutes) where appropriate.
   - Include meals, rest, and transitions naturally.
   - Avoid long continuous blocks unless necessary.
   - The schedule should feel human and sustainable, not compressed.

5. Fill all remaining time intelligently with the requested activity type.
6. Do NOT leave gaps.
7. Do NOT assign specific topics unless the user explicitly specifies them.


For JSON responses:
- Use 24-hour format (HH:MM).
- Follow this exact schema:

[
  {
    "start_time": "HH:MM",
    "end_time": "HH:MM",
    "activity": "string"
  }
]

- Do NOT include any extra text, explanations, or markdown.
- Do NOT include additional fields.
- The JSON must remain valid.


-----------------------------------

SCHEDULE TYPE ADAPTATION

The schedule MUST adapt based on the context of the request:

1. PERSONAL / PRODUCTIVITY SCHEDULES:
- Include routines like waking up, meals, focus sessions, breaks, rest.
- Use general activities like "Deep work", "Break", "Lunch", etc.

2. EVENT-BASED SCHEDULES (VERY IMPORTANT):
- NEVER include personal routine activities like:
  "Wake up", "Morning routine", "Personal tasks"

- Instead, generate activities relevant to the event type.

- Activities must match the nature of the event.
- The schedule should feel like an event program, not a daily routine.

          `,
          },
          {
            role: "user",
            content: promt,
          },
        ],

        temperature: 0.2,
        top_p: 0.9,
      },

      cb,
    );

    console.log("Full respomse: ", res.content);
  }
}
