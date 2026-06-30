import Constants from "expo-constants";
import { CreateScheduleItemArraySchema } from "../models/schedule.model";
import axios from "axios";

const SYSTEM_PROMPT = `
You are Briqon, a specialized AI assistant that focuses on generating schedules.

Your capabilities include:
- Creating daily schedules
- Planning routines
- Organizing time-based activities

Rules:
- Create a strict, chronological schedule.
- Use realistic time blocks (15–60 minutes depending on context).
- Break long activities into smaller focused sessions.
- Include meals, rest, and transitions naturally.
- Use 24-hour format (HH:MM).
- Return ONLY valid JSON.
- Do not include markdown or explanations outside JSON.

Format:
{
  "summary": "A short summary of the generated schedule.",
  "schedule": [
    {
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "activity": "string"
    }
  ]
}
`.trim();

const RETRY_MESSAGE = `
The previous response was invalid.

Requirements:
{
  "summary": "A short summary of the generated schedule.",
  "schedule": [
    {
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "activity": "string"
    }
  ]

Return only valid JSON.
No markdown.
No explanation.
`.trim();

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export class AIService {
  private readonly maxRetries = 3;

  async generateSchedule(prompt: string) {
    const messages: Message[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const response = await this.requestCompletion(messages);

      const schedule = this.validateSchedule(response);

      console.log("generated schedule: ", schedule);

      if (schedule) {
        return schedule;
      }

      messages.push(
        {
          role: "assistant",
          content: response,
        },
        {
          role: "user",
          content: RETRY_MESSAGE,
        },
      );
    }

    throw new Error("Unable to generate a valid schedule");
  }

  private async requestCompletion(messages: Message[]) {
    const maxRetry = 10;

    for (let attemp = 1; attemp <= maxRetry; attemp++) {
      try {
        const apiKey = Constants.expoConfig?.extra?.OPENROUTER_API_KEY;

        const result = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: "openai/gpt-oss-120b:free",
            messages,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          },
        );

        return JSON.parse(result.data.choices[0].message.content);
      } catch (error) {
        console.log("failed: ", error);
        continue;
      }
    }
  }

  private validateSchedule(content: string) {
    try {
      const json = JSON.parse(content);

      return CreateScheduleItemArraySchema.parse(json);
    } catch {
      return null;
    }
  }
}
