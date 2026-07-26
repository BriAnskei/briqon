import { createContext, type ReactNode, useContext, useState } from "react";
import type { NewScheduleFormState } from "@/type/NewScheduleTypes";

type NewScheduleFormContextProvider = {
	setInputForm: (form: NewScheduleFormState) => void;
	inputForm: NewScheduleFormState | undefined;
};

const NewScheduleFormContext =
	createContext<NewScheduleFormContextProvider | null>(null);

export function NewScheduleFormProvider({ children }: { children: ReactNode }) {
	const [inputForm, setInputForm] = useState<NewScheduleFormState | undefined>(
		undefined,
	);

	return (
		<NewScheduleFormContext.Provider
			value={{
				setInputForm,
				inputForm,
			}}
		>
			{children}
		</NewScheduleFormContext.Provider>
	);
}

export function useNewScheduleForm() {
	const ctx = useContext(NewScheduleFormContext);
	if (!ctx) throw new Error("useAI must be used inside AIProvider");

	return ctx;
}
