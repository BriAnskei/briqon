import { isAxiosError } from "axios";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import type { Step } from "@/features/schedule/components/GenerateScheduleScreen/constants";
import type { GenerationResult } from "@/features/schedule/utils/scheduleResponseParser";
import { AIService } from "@/src/service/ai.service";
import type { NewScheduleFormState } from "@/type/NewScheduleTypes";

type AIContextProvider = {
	generateSchedule: () => Promise<any>;
	setInputForm: (form: NewScheduleFormState) => void;
	handleRegenerate: () => void;
	completedSteps: Step[];
	isGenerating: boolean;
	error: string | null;
	result: GenerationResult | null;
	resetRegeneration: () => void;
	generatedScheduleId: string | null;
};

const AIContext = createContext<AIContextProvider | null>(null);

export function AIProvider({ children }: { children: ReactNode }) {
	const aiService = useMemo(() => new AIService(), []);

	const [completedSteps, setCompletedSteps] = useState<Step[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(true);

	const [inputForm, setInputForm] = useState<NewScheduleFormState | undefined>(
		undefined,
	);

	const generateScheduleIdRef = useRef<string | undefined>(null);
	const [result, setResult] = useState<GenerationResult | null>(null);

	const resetRegeneration = useCallback(() => {
		generateScheduleIdRef.current = null;
		setResult(null);
		setCompletedSteps([]);
		setError(null);
	}, []);

	const generateSchedule = useCallback(async () => {
		if (!inputForm) return setError("no data in form");
		setIsGenerating(true);
		try {
			const { generationResult, newScheduleId } =
				await aiService.generateSchedule(inputForm, (s) =>
					setCompletedSteps((prev) => [...prev, s]),
				);

			generateScheduleIdRef.current = newScheduleId;
			setResult(generationResult);
		} catch (err) {
			console.log("Failed:");
			console.error(err);

			if (isAxiosError(err)) {
				console.log(err.response?.status);
				console.log(err.response?.data);
				console.log(err.message);
			}

			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setIsGenerating(false);
		}
	}, [inputForm, aiService]);

	const handleRegenerate = useCallback(() => {
		resetRegeneration();
		generateSchedule();
	}, [resetRegeneration, generateSchedule]);
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
				resetRegeneration,
				generatedScheduleId: generateScheduleIdRef.current ?? null,
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
