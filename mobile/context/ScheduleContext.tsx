import React, {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { ScheduleItem } from "../type/responseType";
import { AiService } from "@/services/ai/ai.service";
import { useAiStreamResponse } from "@/hooks/prompt/useAiStreamResponse";
import { ScheduleItemParser } from "@/utils/scheduleParser";

type ChunkHandler = (chunk: string) => void;
type ModeHandler = (mode: number) => void;

type ScheduleContextType = {
  generate: (prompt: string) => Promise<void>;
  response: string;
  responseLoading: boolean;
  isStreaming: boolean;

  mode?: number;
};

const ScheduleContext = createContext<ScheduleContextType | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const {
    loading,
    setLoading,
    response,
    setResponse,
    isStreaming,
    setIsStreaming,
    mode,
    setMode,
  } = useAiStreamResponse(); // global
  const [sample, setSample] = useState<ScheduleItem[] | undefined>([]);
  const parserRef = useRef<ScheduleItemParser | null>(null);

  if (!parserRef.current) {
    parserRef.current = new ScheduleItemParser({
      onNewItem: (item) => {
        console.log("adding new item: ", item);
        setSample((prev) => [...(prev || []), item]);
      },
      onUpdateItem: (id, field, char) => {
        console.log("updating item ", id, field, char);
        setSample((prev) =>
          prev?.map((item) =>
            item.id === id
              ? {
                  ...item,
                  [field]: (item[field] || "") + char,
                }
              : item,
          ),
        );
      },
    });
  }

  useEffect(() => {
    console.log("sample response; ", sample);
  }, [sample]);

  useEffect(() => {
    console.log("mode: ", mode);
    9;
  }, [mode]);

  // useEffect(() => {
  //   console.log("response: ", response);
  // }, [response]);

  const generate = useCallback(
    async (prompt: string) => {
      try {
        let hasStartedStreaming = false;
        setLoading(true);

        await AiService.streamAi(
          prompt,
          (chunk) => {
            console.log(
              "===============================================Chunk: ",
              chunk,
            );
            setResponse((prev) => prev + chunk);

            parserRef.current?.handleChunk(chunk);

            if (!hasStartedStreaming) {
              setLoading(false);
              setIsStreaming(true);
              hasStartedStreaming = true;
            }
          },
          (mode) => setMode(mode),
        );

        hasStartedStreaming = false;
      } catch (error) {
        console.error("Failed to generate response: ", error);
      }
    },
    [setResponse, setLoading, setIsStreaming, setMode],
  );

  return (
    <ScheduleContext.Provider
      value={{
        generate,
        response,
        responseLoading: loading,
        isStreaming,
        mode,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used inside ScheduleProvider");
  return ctx;
}
