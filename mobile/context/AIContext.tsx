import { api } from "@/api/client";
import { Step } from "@/features/schedule/components/GenerateScheduleScreen/constants";
import {
  GenerationResult,
  parseScheduleResponse,
} from "@/features/schedule/utils/scheduleResponseParser";
import { WizardPromptBuilder } from "@/features/schedule/utils/WizardPromptBuilder";
import { NewScheduleFormState } from "@/type/NewScheduleTypes";
import axios from "axios";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

type AIContextProvider = {
  generateSchedule: () => Promise<any>;
  setInputForm: (form: NewScheduleFormState) => void;
  handleRegenerate: () => void;

  completedSteps: Step[];
  isGenerating: boolean;
  error: string | null;
  result: GenerationResult | null;
};

const AIContext = createContext<AIContextProvider | null>(null);

export function AIProvider({ children }: { children: ReactNode }) {
  const [completedSteps, setCompletedSteps] = useState<Step[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const [inputForm, setInputForm] = useState<NewScheduleFormState | undefined>(
    undefined,
  );

  const delay = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const generateSchedule = useCallback(async () => {
    if (!inputForm) return setError("no data in form");

    setIsGenerating(true);
    setCompletedSteps(["sending"]);

    const { prompt, systemInstruction } = WizardPromptBuilder.build(inputForm);

    try {
      setCompletedSteps((prev) => [...prev, "understanding"]);

      await delay(1200);
      setCompletedSteps((prev) => [...prev, "creating"]);

      const res = await api.post("/api/generate", {
        prompt,
        systemInstruction,
      });

    const parsed = parseScheduleResponse(res.data.res);

      setResult(parsed);
    } catch (err) {
      console.log("Failed:");
      console.error(err);

      if (axios.isAxiosError(err)) {
        console.log(err.response?.status);

        console.log(err.response?.data);
        console.log(err.message);
      }

      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsGenerating(false);
    }
  }, [inputForm]);

  const handleRegenerate = useCallback(() => {
    if (!inputForm) return;
    resetSteps();
    generateSchedule();
  }, [inputForm, generateSchedule]);

  const resetSteps = () => {
    setCompletedSteps([]);
  };

  return (
    <AIContext.Provider
      value={{
        generateSchedule,
        completedSteps,
        isGenerating,
        error,
        setInputForm,
        handleRegenerate,
        result,
      }}
    >
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error("useAI must be used inside AIProvider");

  return ctx;
}
