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
  handleEditSchedule: (
    items: ScheduleItem[],
    edits: QueuedEdit[],
    deletedIndices: number[],
    scheduleStartTime: string,
    scheduleEndTime: string,
  ) => Promise<void>;
};

const ScheduleContext = createContext<ScheduleContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const { loading, setLoading, response, isStreaming, setIsStreaming } =
    useAiStreamResponse();

  const [conversation, setConversation] = useState<MessageTypes[]>([]);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const hasStreamStartedRef = useRef(false);

  const addNewMessage = (message: MessageTypes) => {
    setConversation((prev) => [...prev, message]);
  };

  useEffect(() => {
    console.log("conversation update: ", conversation);
  }, [conversation]);

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
    } catch (error) {
      console.error(error);
    }
  };

  // ── Batch edit schedule ───────────────────────────────────────────────────
  const handleEditSchedule = async (
    items: ScheduleItem[],
    edits: QueuedEdit[],
    deletedIndices: number[],
    scheduleStartTime: string,
    scheduleEndTime: string,
  ) => {
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

      const prompt = buildBatchEditPrompt(
        items,
        edits,
        deletedIndices,
        scheduleStartTime,
        scheduleEndTime,
      );

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

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildBatchEditPrompt(
  items: ScheduleItem[],
  edits: QueuedEdit[],
  deletedIndices: number[],
  scheduleStartTime: string,
  scheduleEndTime: string,
): string {
  const editLines = edits
    .map((e) => {
      const item = items[e.itemIndex];
      return `- [${item.start_time} - ${item.end_time}] "${item.activity}": ${e.prompt}`;
    })
    .join("\n");

  const deleteLines = deletedIndices
    .map((i) => {
      const item = items[i];
      return `- [${item.start_time} - ${item.end_time}] "${item.activity}"`;
    })
    .join("\n");

  return `
You are updating an existing schedule based on user instructions.

Overall schedule bounds: ${scheduleStartTime} - ${scheduleEndTime}

Current full schedule:
${items
  .map(
    (item, i) =>
      `${i + 1}. [${item.start_time} - ${item.end_time}] ${item.activity}`,
  )
  .join("\n")}

${deletedIndices.length > 0 ? `Items to DELETE (remove entirely):\n${deleteLines}` : ""}

${edits.length > 0 ? `Items to EDIT (apply the instruction to that specific item):\n${editLines}` : ""}

STRICT RULES:
- Output ONLY a JSON array of the full updated schedule
- The schedule MUST still start at ${scheduleStartTime} and end at ${scheduleEndTime}
- Remove deleted items completely
- Apply each edit instruction to the specified item only
- Adjust surrounding items to fill gaps or resolve conflicts
- Items with no instructions must remain unchanged
- Do NOT add or remove items unless instructed
- No explanation, no markdown

[
  {
    "start_time": "HH:MM",
    "end_time": "HH:MM",
    "activity": "string"
  }
]
  `.trim();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used inside ScheduleProvider");
  return ctx;
}
