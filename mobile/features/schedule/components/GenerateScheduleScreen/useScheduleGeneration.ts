import { useState, useCallback, useEffect, useRef } from "react";
import { ScheduleResult } from "../types"; // placeholder import – adjust path if needed

/**
 * Hook that manages the schedule generation flow.
 * It tracks the progress steps, result, error state and provides a `generate` function.
 */
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

    // Step 1 – sending request immediately
    setCompletedSteps(["sending"]);

    // Step 2 – scripted "understanding" delay
    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, UNDERSTANDING_DELAY);
      timers.current.push(t);
    });
    setCompletedSteps((prev) => [...prev, "understanding"]);

    // Step 3 – actual backend call (mocked for now)
    try {
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

// ---------------------------------------------------------------------------
// Types & mock helpers – these were originally in the screen file. Keep them
// here so the hook remains self‑contained. Adjust imports if you later replace
// the mock with a real API call.
// ---------------------------------------------------------------------------
type Step = "sending" | "understanding" | "creating" | "done";

const STEP_ORDER: Step[] = ["sending", "understanding", "creating"];
export const STEP_LABELS: Record<Step, string> = {
  sending: "Sending request...",
  understanding: "Understanding your request...",
  creating: "Creating your schedule...",
  done: "Done",
};
export const UNDERSTANDING_DELAY = 600;

/** Mock API – replace with the real fetch when available */
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

// The mock result lives in this module to avoid circular imports.
const MOCK_RESULT: ScheduleResult = {
  summary: {
    categories: [
      {
        name: "Coding",
        total: "11 hours",
        total_minutes: 660,
      },
      {
        name: "Meals",
        total: "2 hr 50 min",
        total_minutes: 170,
        sub_activity: [
          { name: "Breakfast", total: "1 hr 5 min", total_minutes: 65 },
          { name: "Lunch", total: "45 min", total_minutes: 45 },
          { name: "Dinner", total: "45 min", total_minutes: 45 },
          { name: "Snack", total: "15 min", total_minutes: 15 },
        ],
      },
      {
        name: "Education",
        total: "2 hours",
        total_minutes: 120,
        sub_activity: [
          { name: "School / Class", total: "2 hours", total_minutes: 120 },
        ],
      },
      {
        name: "Breaks",
        total: "1 hr 25 min",
        total_minutes: 85,
      },
      {
        name: "Personal Time",
        total: "45 min",
        total_minutes: 45,
        sub_activity: [
          {
            name: "Wind Down / Prepare for Bed",
            total: "45 min",
            total_minutes: 45,
          },
        ],
      },
    ],
  },
  schedule: [
    { start_time: "06:00", end_time: "07:05", activity: "Breakfast" },
    { start_time: "07:05", end_time: "08:25", activity: "Coding" },
    { start_time: "08:25", end_time: "08:35", activity: "Break" },
    { start_time: "08:35", end_time: "09:55", activity: "Coding" },
    { start_time: "09:55", end_time: "10:05", activity: "Break" },
    { start_time: "10:05", end_time: "11:25", activity: "Coding" },
    { start_time: "11:25", end_time: "11:35", activity: "Break" },
    { start_time: "11:35", end_time: "12:20", activity: "Lunch" },
    { start_time: "12:20", end_time: "13:00", activity: "Coding" },
    { start_time: "13:00", end_time: "15:00", activity: "School / Class" },
    { start_time: "15:00", end_time: "15:10", activity: "Break" },
    { start_time: "15:10", end_time: "16:30", activity: "Coding" },
    { start_time: "16:30", end_time: "16:45", activity: "Snack" },
    { start_time: "16:45", end_time: "17:45", activity: "Coding" },
    { start_time: "17:45", end_time: "17:55", activity: "Break" },
    { start_time: "17:55", end_time: "18:40", activity: "Dinner" },
    { start_time: "18:40", end_time: "20:00", activity: "Coding" },
    { start_time: "20:00", end_time: "20:10", activity: "Break" },
    { start_time: "20:10", end_time: "21:30", activity: "Coding" },
    { start_time: "21:30", end_time: "21:40", activity: "Break" },
    { start_time: "21:40", end_time: "23:00", activity: "Coding" },
    { start_time: "23:00", end_time: "23:15", activity: "Break" },
    {
      start_time: "23:15",
      end_time: "00:00",
      activity: "Wind Down / Prepare for Bed",
    },
  ],
};
