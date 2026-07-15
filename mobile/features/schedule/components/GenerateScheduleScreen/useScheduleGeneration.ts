import { useState, useCallback, useEffect, useRef } from "react";
import { Step, UNDERSTANDING_DELAY } from "./constants";
import { ScheduleResult } from "./types";
import { mockGenerateScheduleRequest } from "./mock";
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
