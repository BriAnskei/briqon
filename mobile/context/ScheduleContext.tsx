import React, {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useEffect,
} from "react";
import { MessageTypes, ScheduleItem } from "../type/MessageTypes";
import { AiService } from "@/services/ai/ai.service";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { useAiStreamResponse } from "@/hooks/prompt/useAiStreamResponse";
import { defaultForm } from "@/features/schedule/utils/wizardHelpers";
import { FormState } from "@/type/NewScheduleTypes";
import { useRouter } from "expo-router";
import { ApiError } from "@/services/errors/ai.error";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useToast } from "@/hooks/useToast";

const STORAGE_KEY = "prev_schedule_form";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EditTarget = {
  scheduleId: string;
  items: ScheduleItem[];
};

export type QueuedEdit = {
  itemIndex: number;
  prompt: string;
};

type ScheduleContextType = {
  response: string;
  responseLoading: boolean;
  isStreaming: boolean;
  conversation: MessageTypes[];
  generateScheduleJson: (prompt: string) => Promise<void>;
  generateMessageResponse: (promptMessage: string) => Promise<void>;
  // edit target
  editTarget: EditTarget | null;
  setEditTarget: (target: EditTarget | null) => void;
  // batch edit
  handleEditSchedule: (prompt: string) => Promise<void>;

  // new form input on failed response
  setPrevScheduleFormInput: React.Dispatch<
    React.SetStateAction<FormState | undefined>
  >;
  prevScheduleForm: FormState | undefined;
};

const ScheduleContext = createContext<ScheduleContextType | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { loading, setLoading, response, isStreaming, setIsStreaming } =
    useAiStreamResponse();

  const { showToast } = useToast();

  // new schedule form, this will be used to set the input form of the wizard when the response json format failed in the serveer
  const [prevScheduleForm, setPrevScheduleFormInput] = useState<
    FormState | undefined
  >(undefined);

  const [conversation, setConversation] = useState<MessageTypes[]>([]);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const hasStreamStartedRef = useRef(false);

  useEffect(() => {
    console.log("prevous form input data: ", prevScheduleForm);
  }, [prevScheduleForm]);

  const addNewMessage = (message: MessageTypes) => {
    setConversation((prev) => [...prev, message]);
  };

  // ── Generate message response ─────────────────────────────────────────────
  const generateMessageResponse = async (promptMessage: string) => {
    insertUserMessagePrompt(promptMessage);

    try {
      const newMessageId = uuidv4();
      addNewMessage({
        id: newMessageId,
        role: "ai",
        type: "loading",
        messageType: "message",
      });

      await AiService.generateGeneralMessageStream(promptMessage, (chunk) => {
        if (!hasStreamStartedRef.current) {
          initializeLoadingToMessageType();
          hasStreamStartedRef.current = true;
        }
        updateMessageResponseChunk(chunk);
      });

      hasStreamStartedRef.current = false;
      setIsStreaming(false);
    } catch (error) {
      console.error(error);
    }
  };

  // ── Generate initial schedule ─────────────────────────────────────────────
  const generateScheduleJson = async (prompt: string) => {
    const loadingId = uuidv4();

    setTimeout(() => {
      addNewMessage({
        id: loadingId,
        role: "ai",
        type: "loading",
        messageType: "schedule",
      });
    }, 500);

    try {
      setLoading(true);
      const responseJson = await AiService.generateScheduleJson(prompt);

      const scheduleMessage: Extract<MessageTypes, { type: "schedule" }> = {
        id: uuidv4(),
        role: "ai",
        type: "schedule",
        items: responseJson,
      };

      setConversation((prev) =>
        prev.map((msg) => (msg.id === loadingId ? scheduleMessage : msg)),
      );

      setLoading(false);
    } catch (error: any) {
      console.error(error);

      // reset the conversaiton
      setConversation([]);
      if (error instanceof ApiError && error.status === 400) {
        console.error("Failed to generate a valid json format");
        console.error(error.message);
      }

      router.replace("/schedule/add");

      showToast({
        type: "error",
        title: "Schedule generation failed",
        message:
          "It appears I wasn't able to generate your schedule request today. Please feel free to try again.",
        duration: 5000,
      });
    }
  };

  // ── Batch edit schedule ───────────────────────────────────────────────────
  const handleEditSchedule = async (prompt: string) => {
    const loadingId = uuidv4();

    // push skeleton while model runs
    addNewMessage({
      id: loadingId,
      role: "ai",
      type: "loading",
      messageType: "schedule",
    });

    try {
      setLoading(true);

      const responseJson = await AiService.generateScheduleJson(prompt);

      const scheduleMessage: Extract<MessageTypes, { type: "schedule" }> = {
        id: uuidv4(),
        role: "ai",
        type: "schedule",
        items: responseJson,
      };

      setConversation((prev) =>
        prev.map((msg) => (msg.id === loadingId ? scheduleMessage : msg)),
      );

      setLoading(false);
    } catch (error) {
      console.error(error);
      // remove skeleton on error
      setConversation((prev) => prev.filter((msg) => msg.id !== loadingId));
      setLoading(false);
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
        editTarget,
        setEditTarget,
        handleEditSchedule,

        setPrevScheduleFormInput,
        prevScheduleForm,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );

  // ── Helpers ───────────────────────────────────────────────────────────────

  function initializeLoadingToMessageType() {
    const responseMessage: MessageTypes = {
      id: uuidv4(),
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
      id: uuidv4(),
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
      updated[updated.length - 1] = {
        ...messageBlock,
        text: messageBlock.text + chunk,
      };
      return updated;
    });
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used inside ScheduleProvider");
  return ctx;
}
