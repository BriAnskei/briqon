import { ulid } from "ulid";
import { api } from "@/api/client";
import type { Step } from "@/features/schedule/components/GenerateScheduleScreen/constants";
import {
  type GenerationResult,
  parseScheduleResponse,
} from "@/features/schedule/utils/scheduleResponseParser";
import { WizardPromptBuilder } from "@/features/schedule/utils/WizardPromptBuilder";
import { getTokenAsync } from "@/src/service/auth.service";
import type { NewScheduleFormState } from "@/type/NewScheduleTypes";

export class AIService {
  async generateSchedule(
    formState: NewScheduleFormState,
    onStepProgress: (s: Step) => void,
  ): Promise<{ generationResult: GenerationResult; newScheduleId: string }> {
    onStepProgress("understanding");
    const formRequestPrompt = await withMinDuration(
      Promise.resolve(WizardPromptBuilder.build(formState)),
      500,
    );
    const token = await getTokenAsync();

    onStepProgress("creating");
    // real network call — no padding, this is where the actual time is spent
    const res = await api.post(
      `/api/generate`,
      { ...formRequestPrompt },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
    if (!res.data.success)
      throw new Error(res.data.error.message ?? "Failed to generate schedule");

    onStepProgress("parsing");
    const newScheduleId = await withMinDuration(Promise.resolve(ulid()), 500);

    return {
      generationResult: parseScheduleResponse(res.data.res, newScheduleId),
      newScheduleId,
    };
  }
}

async function withMinDuration<T>(promise: Promise<T>, ms: number): Promise<T> {
  const [result] = await Promise.all([
    promise,
    new Promise((resolve) => setTimeout(resolve, ms)),
  ]);
  return result;
}
