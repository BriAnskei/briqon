/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable import/no-named-as-default-member */
import { api } from "@/api/client";
import { getTokenAsync } from "@/features/schedule/auth/auth.service";
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
  resetSteps: () => void
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

  const resetSteps = () => {
    setCompletedSteps([]);
    setError(null)
  };



  const generateSchedule = useCallback(async () => {
    if (!inputForm) return setError("no data in form");
    setCompletedSteps(["sending"]);

    setIsGenerating(true);

    const { prompt, systemInstruction } = WizardPromptBuilder.build(inputForm);

    try {
      setCompletedSteps((prev) => [...prev, "understanding"]);
      await delay(900);

      const token = await getTokenAsync();

      const res = await api.post(
        "/api/generate",
        {
          prompt,
          systemInstruction,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      await delay(900);

      const parsed = parseScheduleResponse(res.data.res);

      setResult(parsed);
      setCompletedSteps((prev) => [...prev, "creating"]);
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
    resetSteps();
    generateSchedule();
  }, [inputForm, generateSchedule]);


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
        resetSteps
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
