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
      setConversation((prev) => [...prev, userMessage]);

      // 2. Reset parser state for new stream
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
              msg.id === aiMessageIdRef.current &&
              msg.role === "ai" &&
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

      try {
        let hasStartedStreaming = false;
        setLoading(true);

        await AiService.streamAi(
          prompt,
          (chunk) => {
            // 3. On first chunk, now we know the mode — push the AI message shell
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

              setConversation((prev) => [...prev, aiMessage]);
            }

            // 4. Route chunk to the right updater
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
            } else if (currentModeRef.current === 1) {
              scheduleParserRef.current?.handleChunk(chunk);
            }
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
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used inside ScheduleProvider");
  return ctx;
}
