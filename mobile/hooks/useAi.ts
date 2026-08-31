import { useCallback, useMemo, useRef, useState } from "react";
import type { Step } from "@/features/schedule/components/GenerateScheduleScreen/constants";
import type { GenerationResult } from "@/features/schedule/utils/scheduleResponseParser";
import { AIService } from "@/src/service/ai.service";
import type { NewScheduleFormState } from "@/type/NewScheduleTypes";

const useAi = () => {
  const aiService = useMemo(() => new AIService(), []);

  const [result, setResult] = useState<GenerationResult | null>(null);

  const [completedSteps, SetCompletedSteps] = useState<Step[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);

  const isGeneratingRef = useRef(false);
  const newScheduleGeneratedIdRef = useRef<string | undefined>(undefined);

  const resetState = useCallback(() => {
    setError(undefined);
    setResult(null);
    SetCompletedSteps([]);
    newScheduleGeneratedIdRef.current = undefined;
    isGeneratingRef.current = false;
  }, []);

  const handleGenerateSchedule = useCallback(
    async (formState: NewScheduleFormState | undefined): Promise<void> => {
      if (isGeneratingRef.current) return;
      resetState();

      if (!formState) {
        setError("No Input state data");
        return;
      }
      isGeneratingRef.current = true;
      try {
        const { generationResult, newScheduleId } = await aiService.generateSchedule(
          formState,
          (s) => SetCompletedSteps((prev) => [...prev, s]),
        );

        setResult(generationResult);
        newScheduleGeneratedIdRef.current = newScheduleId;
      } catch (err) {
        console.log(err, "Failed to generate");
        setError(err instanceof Error ? err.message : "Failed to generated Schedule");
      } finally {
        isGeneratingRef.current = false;
      }
    },
    [aiService, resetState],
  );

  return {
    result,
    generatedScheduleId: newScheduleGeneratedIdRef.current,
    handleGenerateSchedule,
    resetState,
    completedSteps,
    isGenerating: isGeneratingRef.current,
    error,
  };
};

export default useAi;
