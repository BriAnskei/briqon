import { useRef, useState, useCallback, useEffect } from "react";
import { Step, STEP_LABELS, STEP_ORDER, UNDERSTANDING_DELAY } from "@/features/schedule/components/GenerateScheduleScreen/constants";
import { ScheduleResult } from "@/features/schedule/components/GenerateScheduleScreen/types";

// Mock data and request function are imported from the screen module for now.
// In a real app, replace these with actual API calls.

export function useScheduleGeneration() {
  const [completedSteps, setCompletedSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const generate = useCallback(async () => {
    clearTimers();
    setError(null);
    setResult(null);
    setCompletedSteps([]);
    setIsGenerating(true);

    // sending step – immediate
    setCompletedSteps(["sending"]);

    // understanding step – artificial delay
    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, UNDERSTANDING_DELAY);
      timers.current.push(t);
    });
    setCompletedSteps((prev) => [...prev, "understanding"]);

    // creating step – wait for backend
    try {
      // NOTE: Replace `mockGenerateScheduleRequest` with your real request.
      const response = await mockGenerateScheduleRequest();
      if (response.success && response.res) {
        setCompletedSteps((prev) => [...prev, "creating", "done"]);
        setResult(response.res);
      } else {
        setError(response.error ?? "Something went wrong. Please try again.");
      }
    } catch (err: any) {
      setError(err.message ?? "Network error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => clearTimers, []);

  return { generate, completedSteps, result, error, isGenerating };
}

// ---------- Helper types & mock request (should be moved out later) ----------

// NOTE: The original file defined `ScheduleResult` as `z.infer<any>`; we keep the same
// loose typing here to avoid pulling in the Zod schema in the hook layer.
export type ScheduleResult = any;

// Mock data – copy‑paste from the original screen for now.
import { MOCK_RESULT } from "@/features/schedule/components/GenerateScheduleScreen/mock";

function mockGenerateScheduleRequest(): Promise<{
  success: boolean;
  res?: ScheduleResult;
  error?: string;
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, res: MOCK_RESULT });
    }, 1800);
  });
}
