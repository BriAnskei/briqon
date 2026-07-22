import { useEffect } from "react";
import { useAI } from "@/context/AIContext";
import useSaveScheduleModal from "./useSaveScheduleModal";

export function useGenerateScheduleScreen() {
	const {
		completedSteps,
		result,
		isGenerating,
		error,
		handleRegenerate,
		generateSchedule,
		resetSteps,
	} = useAI();
	const saveScheduleModalState = useSaveScheduleModal({
		summaries: result?.summary ?? [],
		subSummaries: result?.subSummary ?? [],
		scheduleItem: result?.schedule ?? [],
	});

	useEffect(() => {
		generateSchedule();
	}, [generateSchedule]);

	return {
		handleRegenerate,
		completedSteps,
		result,
		error,
		isGenerating,
		saveScheduleModalState,
		resetSteps,
	};
}
