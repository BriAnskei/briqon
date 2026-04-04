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
  generate: (prompt: string) => Promise<void>;
  response: string;
  responseLoading: boolean;
  isStreaming: boolean;

  currentModeRef: React.RefObject<number | null>;
  conversation: MessageTypes[];
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

  const generate = useCallback(
    async (prompt: string) => {
      // 1. Push the user message immediately
      const userMessage: MessageTypes = {
        id: Date.now().toString(),
        role: "user",
        text: prompt,
      };
      addNewMessage(userMessage);

      // 2. Reset parser state for new stream
      InitializeScheduleParser(
        scheduleParserRef,
        setConversation,
        aiMessageIdRef,
      );

      try {
        let hasStartedStreaming = false;
        setLoading(true);

        await AiService.streamAi(
          prompt,
          (chunk) => {
            // 3. On first chunk, now we know the mode — push the AI message shell
            hasStartedStreaming = addNewMessageOnStream(hasStartedStreaming);

            // 4. Route chunk to the right updater
            handleResponseChunkBasedOnMode(chunk);
          },
          (mode) => {
            currentModeRef.current = mode;
            setMode(mode);
          },
        );

        setIsStreaming(false);
        hasStartedStreaming = false;
      } catch (error) {
        console.error("Failed to generate response: ", error);
        setIsStreaming(false);
      }
    },
    [setLoading, setIsStreaming, setMode],
  );

  const addNewMessage = (message: MessageTypes) => {
    setConversation((prev) => [...prev, message]);
  };

  return (
    <ScheduleContext.Provider
      value={{
        generate,
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

  function handleResponseChunkBasedOnMode(chunk: string) {
    // General response
    if (currentModeRef.current === 0) {
      setConversation((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageIdRef.current &&
          msg.role === "ai" &&
          msg.type === "chat"
            ? { ...msg, text: msg.text + chunk }
            : msg,
        ),
      );
    }
    // Schedule response
    else if (currentModeRef.current === 1) {
      scheduleParserRef.current?.handleChunk(chunk);
    }
  }

  function addNewMessageOnStream(hasStartedStreaming: boolean) {
    if (!hasStartedStreaming) {
      hasStartedStreaming = true;
      setLoading(false);
      setIsStreaming(true);

      const aiMessageId = Date.now().toString();
      aiMessageIdRef.current = aiMessageId;

      // Push the correct message shape based on mode
      const aiMessage: MessageTypes =
        currentModeRef.current === 1
          ? { id: aiMessageId, role: "ai", type: "schedule", items: [] }
          : { id: aiMessageId, role: "ai", type: "chat", text: "" };

      addNewMessage(aiMessage);
    }
    return hasStartedStreaming;
  }
}

function InitializeScheduleParser(
  scheduleParserRef: React.RefObject<ScheduleItemParser | null>,
  setConversation: React.Dispatch<React.SetStateAction<MessageTypes[]>>,
  aiMessageIdRef: React.RefObject<string | null>,
) {
  scheduleParserRef.current = new ScheduleItemParser({
    onNewItem: (item) => {
      setConversation((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageIdRef.current &&
          msg.role === "ai" &&
          msg.type === "schedule"
            ? { ...msg, items: [...msg.items, item] }
            : msg,
        ),
      );
    },
    onUpdateItem: (id, field, char) => {
      setConversation((prev) =>
        prev.map((msg) =>
          msg.role === "ai" &&
          msg.id === aiMessageIdRef.current &&
          msg.type === "schedule"
            ? {
                ...msg,
                items: msg.items.map((item) =>
                  item.id === id
                    ? { ...item, [field]: (item[field] || "") + char }
                    : item,
                ),
              }
            : msg,
        ),
      );
    },
  });
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used inside ScheduleProvider");
  return ctx;
}
