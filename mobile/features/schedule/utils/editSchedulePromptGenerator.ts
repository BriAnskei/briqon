import { ScheduleItem } from "@/type/MessageTypes";
import { formatTime } from "@/utils/parseSchedule";
import { rulesJsonPrompt } from "./wizardHelpers";

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
You are given an existing schedule and a set of requested changes. Apply ONLY the requested changes. Keep all other items exactly as they are.

Schedule window: ${formatTime(scheduleStartTime)} – ${formatTime(scheduleEndTime)}

Current schedule:
${itemList}

Instructions:
- Items marked ← REMOVE THIS must be excluded from the output.
- Items marked ← EDIT must be modified according to the instruction.
- All other items must remain unchanged (same activity name, same times).
- Re-adjust times only where necessary to fill gaps left by removed items or to accommodate edits — do not shift unaffected items.
- Do not add new activities unless an edit explicitly asks for one.

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
