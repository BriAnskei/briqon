import { useCallback, useMemo, useRef, useState } from "react";
import type { Step } from "@/features/schedule/components/GenerateScheduleScreen/constants";
import type { GenerationResult } from "@/features/schedule/utils/scheduleResponseParser";
import { AIService } from "@/src/service/ai.service";
import type { NewScheduleFormState } from "@/type/NewScheduleTypes";

const useAi = () => {
	const aiService = useMemo(() => new AIService(), []);

	const [result, setResult] = useState<GenerationResult | null>(null);

	const [isGenerating, setIsGenerating] = useState(true);
	const [completedSteps, SetCompletedSteps] = useState<Step[]>([]);
	const [error, setError] = useState<string | undefined>(undefined);

	const newScheduleGeneratedIdRef = useRef<string | null>(null);

	const handleGenerateSchedule = useCallback(
		async (formState: NewScheduleFormState | undefined): Promise<void> => {
			if (!formState) {
				setError("No Input state data");
				return;
			}

			try {
				setIsGenerating(true);

				const { generationResult, newScheduleId } =
					await aiService.generateSchedule(formState, (s) =>
						SetCompletedSteps((prev) => [...prev, s]),
					);

				setResult(generationResult);
				newScheduleGeneratedIdRef.current = newScheduleId;
			} catch (err) {
				console.log(err, "Failed to generate");
				setError(
					err instanceof Error ? err.message : "Failed to generated Schedule",
				);
			} finally {
				setIsGenerating(false);
			}
		},
		[aiService],
	);

	const resetState = () => {
		setError(undefined);
		setResult(null);
		SetCompletedSteps([]);
	};

	return {
		result,
		handleGenerateSchedule,
		resetState,
		completedSteps,
		isGenerating,
		error,
	};
};

export default useAi;
