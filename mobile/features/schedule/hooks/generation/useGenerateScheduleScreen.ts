import { useCallback, useEffect, useState } from "react";
import { useNewScheduleForm } from "@/context/NewScheduleFormContext";
import useAi from "@/hooks/useAi";
import useSaveScheduleModal from "./useSaveScheduleModal";
import { useSetActiveModal } from "./useSetActiveModal";

export function useGenerateScheduleScreen() {
	const { inputForm } = useNewScheduleForm();

	const [isScheduleSavedDirectly, setIsScheduleSavedDirectly] = useState(false);
	const [isScheduleSavedByActivation, setIsScheduleSavedByActivation] =
		useState(false);

	const {
		result,
		generatedScheduleId,
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
		generatedScheduleId,
		isScheduleSavedDirectly,
		setIsScheduleSavedDirectly,
		isScheduleSavedByActivation,
	});

	const setActiveModalState = useSetActiveModal({
		result,
		generatedScheduleId,
		scheduleItems: result?.schedule ?? [],
		isScheduleSavedByActivation,
		isScheduleSavedDirectly,
		setIsScheduleSavedByActivation,
	});

	useEffect(() => {
		handleGenerateSchedule(inputForm);
	}, [handleGenerateSchedule, inputForm]);

	const handleRegenerate = useCallback(() => {
		resetState();
		handleGenerateSchedule(inputForm);
	}, [handleGenerateSchedule, inputForm, resetState]);

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
