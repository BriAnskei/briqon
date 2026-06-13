import { ScheduleItem } from "@/type/MessageTypes";
import { formatTime } from "@/utils/parseSchedule";
import { rulesJsonPrompt } from "./WizardPromptBuilder";

export function buildEditPrompt(
  items: ScheduleItem[],
  edits: { itemIndex: number; prompt: string }[],
  deletedIndices: number[],
  scheduleStartTime: string,
  scheduleEndTime: string,
): string {
  const itemList = items
    .map((item, i) => {
      const label = `[${i}] ${formatTime(item.start_time!)} - ${formatTime(item.end_time)}: ${item.activity}`;
      const edit = edits.find((e) => e.itemIndex === i);
      const isDeleted = deletedIndices.includes(i);

      if (isDeleted) return `${label}  ← REMOVE THIS`;
      if (edit) return `${label}  ← EDIT: "${edit.prompt}"`;
      return label;
    })
    .join("\n");

  const res = `
You are given an existing schedule and a set of requested changes. 

Schedule window: ${formatTime(scheduleStartTime)} – ${formatTime(scheduleEndTime)}

Current schedule:
${itemList}

Instructions:
- Apply the requested changes (EDIT or REMOVE).
- Return the updated schedule as a set of "fixed_appointments".
- Keep unchanged items as "fixed_appointments" with their original times.
- Ensure the "preferences" day_start and day_end match the schedule window.

${rulesJsonPrompt}
  `.trim();

  return res;
}

export function buildSingleCallPrompt(
  userPrompt: string,
  schedule: ScheduleItem[],
) {
  return `
You are given an existing schedule and a user request.

Schedule:
${schedule
  .map((s) => `- ${s.activity} (${s.start_time} - ${s.end_time})`)
  .join("\n")}

User question:
"${userPrompt}"

Return ONLY JSON:

{
  "intent": "duration_query" | "general_question",
  "activities": string[],
  "needsCalculation": boolean,
  "answer": string | null
}

Rules:
- If calculation is needed, set "needsCalculation": true and leave "answer": null
- If general question, answer directly in "answer"
- Do NOT explain outside JSON
`;
}
