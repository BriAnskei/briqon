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

  const [conversation, setConversation] = useState<MessageTypes[]>([]);

  // general message response flase
  const hasStreamStartedRef = useRef(false);

  const addNewMessage = (message: MessageTypes) => {
    setConversation((prev) => [...prev, message]);
  };

  useEffect(() => {
    console.log("conversaion update: ", conversation);
  }, [conversation]);

  const generateMessageResponse = async (promptMessage: string) => {
    insertUserMessagePrompt(promptMessage);

    try {
      let newMessageId = Date.now().toString();

      addNewMessage({
        id: newMessageId,
        role: "ai",
        type: "loading",
        messageType: "message",
      });

      let responseFormat = "";
      await AiService.generateGeneralMessageStream(promptMessage, (chunk) => {
        responseFormat += chunk;

        if (hasStreamStartedRef.current) {
          setLoadingBlockToMessageType();
          hasStreamStartedRef.current = true;
        }

        // update message chunk on the last conversation index ref
        updateMessageResponseChunk(chunk);
      });

      // end of the stream
      hasStreamStartedRef.current = false;

      setIsStreaming(false);
    } catch (error) {
      console.error(error);
    }
  };

  const generateScheduleJson = async (prompt: string) => {
    const loadingId = Date.now().toString();

    // push skeleton into conversation immediately
    addNewMessage({
      id: loadingId,
      role: "ai",
      type: "loading",
      messageType: "schedule",
    });

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

  function setLoadingBlockToMessageType() {
    const responseMessage: MessageTypes = {
      id: Date.now().toString(),
      role: "ai",
      type: "chat",
      text: "",
    };

    setConversation((prev) => {
      const newConversation = [...prev];

      newConversation[newConversation.length - 1] = { ...responseMessage };
      return newConversation;
    });

    setIsStreaming(true);
    setLoading(false);
  }

  function insertUserMessagePrompt(promptMessage: string) {
    const userMessagePrompt: Extract<MessageTypes, { role: "user" }> = {
      id: Date.now().toString(),
      role: "user",
      text: promptMessage,
    };

    addNewMessage(userMessagePrompt);

    setLoading(true);
  }

  function updateMessageResponseChunk(chunk: string) {
    setConversation((prev) => {
      const updated = [...prev];

      const messageBlock = updated[updated.length - 1] as Extract<
        MessageTypes,
        { type: "chat" }
      >;

      // message response will always be the last index
      updated[updated.length - 1] = {
        ...messageBlock,
        text: messageBlock.text + chunk,
      };

      return updated;
    });
  }
}
export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used inside ScheduleProvider");
  return ctx;
}
