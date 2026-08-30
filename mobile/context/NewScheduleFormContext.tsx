import { useRouter } from "expo-router";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    console.log("form update: ", inputForm);
  }, [inputForm]);

  const generateScheduleBasedOnForm = (form: NewScheduleFormState) => {
    if (inputForm) return;

    console.log("1. generating");

    setInputForm(form);

    console.log("2. before push");

    router.push("/schedule/generation");

    console.log("3. after push");
  };

  const resetState = () => {
    console.log("rest form");
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

export function useNewScheduleFormContext() {
  const ctx = useContext(NewScheduleFormContext);
  if (!ctx) throw new Error("useAI must be used inside AIProvider");

  return ctx;
}
