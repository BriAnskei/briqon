import { useRouter } from "expo-router";
import { createContext, type ReactNode, useContext, useState } from "react";
import type { NewScheduleFormState } from "@/type/NewScheduleTypes";

type NewScheduleFormContextProvider = {
  inputForm: NewScheduleFormState | undefined;
  resetState: () => void;
  generateScheduleBasedOnForm: (form: NewScheduleFormState) => void;
};

const NewScheduleFormContext = createContext<NewScheduleFormContextProvider | null>(null);

export function NewScheduleFormProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [inputForm, setInputForm] = useState<NewScheduleFormState | undefined>(undefined);

  const generateScheduleBasedOnForm = (form: NewScheduleFormState) => {
    setInputForm(form);

    if (inputForm) router.push("/schedule/generation");
  };

  const resetState = () => {
    setInputForm(undefined);
  };

  return (
    <NewScheduleFormContext.Provider
      value={{
        resetState,
        inputForm,
        generateScheduleBasedOnForm,
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
