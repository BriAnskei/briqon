import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useNewScheduleForm } from "@/context/NewScheduleFormContext";
import useAi from "@/hooks/useAi";
import useSaveScheduleModal from "./useSaveScheduleModal";
import { useSetActiveModal } from "./useSetActiveModal";

export function useGenerateScheduleScreen() {
  const router = useRouter();
  const { inputForm, resetState: resetFormState } = useNewScheduleForm();

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
    aiState.handleGenerateSchedule(inputForm);
  }, [aiState.handleGenerateSchedule, inputForm]);

  const resetGenerationState = () => {
    aiState.resetState();
    setActiveModalState.resetState();
    saveScheduleModalState.closeSaveSchedModal();
    setShowRegenerateCard(false);
    // reset from context form
    resetFormState();
  };

  const resetFullGenerateFormState = () => {
    resetFormState();
    setShowRegenerateCard(false);
    resetFullGenerateFormState();
  };

  const handleGoHome = () => {
    resetFullGenerateFormState();
    router.replace("/");
  };

  const handleBackToForm = () => {
    resetGenerationState();
    router.back();
  };

  const handleSetActive = () => {
    setActiveModalState.open();
  };

  const handleSaveSchedule = () => {
    saveScheduleModalState.openSaveSchedModal();
  };

  const handleRegenerate = useCallback(() => {
    if (aiState.isGenerating) return;

    aiState.handleGenerateSchedule(inputForm);
  }, [aiState.handleGenerateSchedule, aiState.isGenerating, inputForm]);

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
