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
import { v4 as uuidv4 } from "uuid";
import { useAiStreamResponse } from "@/hooks/prompt/useAiStreamResponse";

type ScheduleContextType = {
  response: string;
  responseLoading: boolean;
  isStreaming: boolean;
  conversation: MessageTypes[];
  generateScheduleJson: (prompt: string) => Promise<void>;
  generateMessageResponse: (promptMessage: string) => Promise<void>;
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
  } = useAiStreamResponse(); // global

  const aiLastMessageIndex = useRef<number | null>(null);

  const [conversation, setConversation] = useState<MessageTypes[]>([]);

  const addNewMessage = (message: MessageTypes) => {
    setConversation((prev) => [...prev, message]);
  };

  useEffect(() => {
    console.log("conversaion update: ", conversation);
  }, [conversation]);

  const generateMessageResponse = async (promptMessage: string) => {
    const userMessagePrompt: Extract<MessageTypes, { role: "user" }> = {
      id: Date.now().toString(),
      role: "user",
      text: promptMessage,
    };

    addNewMessage(userMessagePrompt);

    setLoading(true);

    try {
      let hasStartedStreaming = false;

      let responseFormat = "";
      await AiService.generateGeneralMessageStream(promptMessage, (chunk) => {
        responseFormat += chunk;

        if (!hasStartedStreaming) {
          const responseMessage: MessageTypes = {
            id: Date.now().toString(),
            role: "ai",
            type: "chat",
            text: "",
          };

          setConversation((prev) => {
            const newConversation = [...prev, responseMessage];

            aiLastMessageIndex.current = newConversation.length - 1;
            return newConversation;
          });

          hasStartedStreaming = true;
          setIsStreaming(true);
          setLoading(false);
        }

        // update message chunk on the last conversation index ref
        setConversation((prev) => {
          const index = aiLastMessageIndex.current;
          if (index === null) return prev;

          const updated = [...prev];
          const msg = updated[index];

          if (msg.role === "ai" && msg.type === "chat")
            if (msg.role === "ai" && msg.type === "chat") {
              const normalizedChunk = chunk === "" ? "\n" : chunk;
              updated[index] = { ...msg, text: msg.text + normalizedChunk };
            }

          return updated;
        });
      });

      console.log("response format", responseFormat);
      setIsStreaming(false);
    } catch (error) {
      console.error(error);
    }
  };

  const generateScheduleJson = async (prompt: string) => {
    const loadingId = Date.now().toString();

    // push skeleton into conversation immediately
    addNewMessage({ id: loadingId, role: "ai", type: "loading" });
    try {
      setLoading(true);
      const responseJson = await AiService.generateScheduleJson(prompt);

      // add response to the conversation
      const scheduleMessage: Extract<MessageTypes, { type: "schedule" }> = {
        id: Date.now().toString(),
        role: "ai",
        type: "schedule",
        items: responseJson,
      };

      // replace the skeleton with the real schedule
      setConversation((prev) =>
        prev.map((msg) => (msg.id === loadingId ? scheduleMessage : msg)),
      );

      setLoading(false);
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
        conversation,
        generateMessageResponse,
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
