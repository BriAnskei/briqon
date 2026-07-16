/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { useAI } from "@/context/AIContext";

export function useScheduleGeneration() {
  const {
    completedSteps,
    result,
    isGenerating,
    error,
    handleRegenerate,
    generateSchedule,
  } = useAI();

  useEffect(() => {
    // generate when render
    generateSchedule();
  }, []);

  return { handleRegenerate, completedSteps, result, error, isGenerating };
}
