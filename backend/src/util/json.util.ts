import { ScheduleItem, ScheduleSchema } from '../ai/schemas/schedule.schema';

function extractJson(text: string): string {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  return text.trim();
}

function safeParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Invalid Json format');
  }
}

export function parseValidator(response: string): {
  success: boolean;
  scheduleItems?: ScheduleItem[];
  message?: string;
} {
  const cleanedJsonString = extractJson(response);
  const parsedJson = safeParseJson(cleanedJsonString);

  const resZodParseJson = ScheduleSchema.safeParse(parsedJson);

  if (resZodParseJson.success)
    return { success: true, scheduleItems: resZodParseJson.data };

  return { success: false, message: resZodParseJson.error.message };
}
