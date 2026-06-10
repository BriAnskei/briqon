import { AIService } from "@/src/service/ai.service";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type AIContextProvider = {
  service: AIService | null;
  ready: boolean;
  progress: number;
};

const AIContext = createContext<AIContextProvider | null>(null);

export function AIProvider({ children }: { children: ReactNode }) {
  const [service] = useState(() => new AIService());
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        await service.initialize(setProgress);

        setReady(true);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  return (
    <AIContext.Provider value={{ service, ready, progress }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error("useAI must be used inside AIProvider");

  return ctx;
}
