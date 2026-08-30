import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useNewScheduleFormContext } from "@/context/NewScheduleFormContext";
import useAi from "@/hooks/useAi";
import useSaveScheduleModal from "./useSaveScheduleModal";
import { useSetActiveModal } from "./useSetActiveModal";

export function useGenerateScheduleScreen() {
  const router = useRouter();
  const { inputForm, resetState: resetFormState } = useNewScheduleFormContext();

  const [isScheduleSavedDirectly, setIsScheduleSavedDirectly] = useState(false);
  const [isScheduleSavedByActivation, setIsScheduleSavedByActivation] = useState(false);

  const aiState = useAi();

  const saveScheduleModalState = useSaveScheduleModal({
    summaries: aiState.result?.summary ?? [],
    subSummaries: aiState.result?.subSummary ?? [],
    scheduleItem: aiState.result?.schedule ?? [],
    generatedScheduleId: aiState.generatedScheduleId,
    isScheduleSavedDirectly,
    setIsScheduleSavedDirectly,
  });

  const setActiveModalState = useSetActiveModal({
    result: aiState.result,
    generatedScheduleId: aiState.generatedScheduleId,
    scheduleItems: aiState.result?.schedule ?? [],
    isScheduleSavedByActivation,
    isScheduleSavedDirectly,
    setIsScheduleSavedByActivation,
  });

  const [showRegenerateCard, setShowRegenerateCard] = useState(false);

  useEffect(() => {
    if (!aiState.isGenerating) {
      setShowRegenerateCard(false);
      return;
    }
    const t = setTimeout(() => setShowRegenerateCard(true), 3000);
    return () => clearTimeout(t);
  }, [aiState.isGenerating]);

  useEffect(() => {
    if (!inputForm || aiState.result) return;
    aiState.handleGenerateSchedule(inputForm);
  }, [aiState.handleGenerateSchedule, aiState.result, inputForm]);

  const resetScheduleGenerationFullState = () => {
    aiState.resetState();
    setActiveModalState.resetState();
    saveScheduleModalState.closeSaveSchedModal();
    setShowRegenerateCard(false);
    resetFormState();
  };

  const handleGoHome = () => {
    resetScheduleGenerationFullState();
    router.replace("/");
  };

  const handleBackToForm = () => {
    resetScheduleGenerationFullState();
    router.back();
  };

  const handleSetActive = () => {
    setActiveModalState.open();
  };

  const handleSaveSchedule = () => {
    saveScheduleModalState.openSaveSchedModal();
  };

  const handleRegenerate = useCallback(() => {
    if (aiState.isGenerating || !aiState.error || !inputForm) return;

    aiState.handleGenerateSchedule(inputForm);
  }, [aiState.handleGenerateSchedule, aiState.isGenerating, aiState.error, inputForm]);

  return {
    handleRegenerate,
    ...aiState,
    saveScheduleModalState,
    setActiveModalState,
    showRegenerateCard,

    handleBackToForm,
    handleGoHome,
    handleSetActive,
    handleSaveSchedule,
  };
}
