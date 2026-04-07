import React, {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { MessageTypes, ScheduleItem } from "../type/MessageTypes";
import { AiService } from "@/services/ai/ai.service";

import { ScheduleItemParser } from "@/utils/scheduleParser";
import { useAiStreamResponse } from "@/hooks/prompt/useScheduleResponse";

type ScheduleContextType = {
  response: string;
  responseLoading: boolean;
  isStreaming: boolean;

  currentModeRef: React.RefObject<number | null>;
  conversation: MessageTypes[];

  generateScheduleJson: (prompt: string) => Promise<void>;
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

  const scheduleParserRef = useRef<ScheduleItemParser | null>(null);
  const currentModeRef = useRef<number | null>(null);

  const [conversation, setConversation] = useState<MessageTypes[]>([]);

  const aiMessageIdRef = useRef<string | null>(null);

  const addNewMessage = (message: MessageTypes) => {
    setConversation((prev) => [...prev, message]);
  };

  const generateScheduleJson = async (prompt: string) => {
    try {
      const responseJson = await AiService.generateScheduleJson(prompt);

      // add response to the conversation
      const scheduleMessage: MessageTypes = {
        id: Date.now().toString(),
        role: "user",
        items: responseJson,
      };

      console.log("response json: ", responseJson);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScheduleContext.Provider
      value={{
        generateScheduleJson,
        response,
        responseLoading: loading,
        isStreaming,
        currentModeRef,
        conversation,
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
