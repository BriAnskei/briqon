import { ulid } from "ulid";
import { api } from "@/api/client";
import { getTokenAsync } from "@/features/schedule/auth/auth.service";
import type { Step } from "@/features/schedule/components/GenerateScheduleScreen/constants";
import {
	type GenerationResult,
	parseScheduleResponse,
} from "@/features/schedule/utils/scheduleResponseParser";
import { WizardPromptBuilder } from "@/features/schedule/utils/WizardPromptBuilder";
import type { NewScheduleFormState } from "@/type/NewScheduleTypes";

export class AIService {
	async generateSchedule(
		formState: NewScheduleFormState,
		onStepProgress: (s: Step) => void,
	): Promise<{ generationResult: GenerationResult; newScheduleId: string }> {
		onStepProgress("creating");

		const formRequestPrompt = WizardPromptBuilder.build(formState);
		const token = await getTokenAsync();

		onStepProgress("understanding");
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
			throw new Error(res.data.error ?? "Failed to generate schedule");

		onStepProgress("parsing");

		const newScheduleId = ulid();

		return {
			generationResult: parseScheduleResponse(res.data.res, newScheduleId),
			newScheduleId,
		};
	}
}
