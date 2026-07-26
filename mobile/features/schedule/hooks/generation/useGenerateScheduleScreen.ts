import { useEffect } from "react";
import { useNewScheduleForm } from "@/context/NewScheduleFormContext";
import useAi from "@/hooks/useAi";
import useSaveScheduleModal from "./useSaveScheduleModal";
import { useSetActiveModal } from "./useSetActiveModal";

export function useGenerateScheduleScreen() {
	const { inputForm } = useNewScheduleForm();

	const {
		result,
		handleGenerateSchedule,
		completedSteps,
		isGenerating,
		error,
		resetState,
	} = useAi();

	const saveScheduleModalState = useSaveScheduleModal({
		summaries: result?.summary ?? [],
		subSummaries: result?.subSummary ?? [],
		scheduleItem: result?.schedule ?? [],
	});

	const setActiveModalState = useSetActiveModal();

	useEffect(() => {
		handleGenerateSchedule(inputForm);
	}, [handleGenerateSchedule, inputForm]);

	const handleRegenerate = () => {
		resetState();
		handleGenerateSchedule;
	};

	return {
		handleRegenerate,
		handleGenerateSchedule,
		completedSteps,
		result,
		error,
		isGenerating,
		saveScheduleModalState,
		setActiveModalState,
		resetRegeneration: resetState,
	};
}
