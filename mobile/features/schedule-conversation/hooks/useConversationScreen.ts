import { useCallback, useEffect, useRef, useState } from "react";
import { useTextInput } from "../../../hooks/useInput";
import { MessageTypes } from "@/type/MessageTypes";
import { useSchedule } from "@/context/ScheduleContext";
import { ScrollView } from "react-native";
import { ScheduleItem } from "@/type/MessageTypes";
import { useRouter } from "expo-router";

export const useConversationScreen = () => {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const {
    generateMessageResponse,
    conversation,
    isStreaming,
    responseLoading,
    prevScheduleForm,
  } = useSchedule();

  const { prompt, setPrompt } = useTextInput();

  const [modalVisible, setModalVisible] = useState(false);

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );

  const [questionScheduleId, setQuestionScheduleId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (conversation.length === 0) return;
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timeout);
  }, [conversation]);

  // Derive all schedule blocks in order of appearance for numbering
  const scheduleBlocks = conversation.filter(
    (t) => t.role === "ai" && t.type === "schedule",
  );

  // count the number of the schedule
  const getQuestionScheduleNumberr = () => {
    let numberOfSched = 0;
    for (let c of conversation) {
      if (c.role === "ai" && c.type === "schedule") {
        numberOfSched++;
        if (c.id === questionScheduleId) return numberOfSched;
      }
    }

    return null;
  };
  const handleSend = useCallback(
    async (text: string) => {
      let generatedPrompt: string | undefined;

      if (questionScheduleId) {
        for (let c of conversation) {
          if (c.id === questionScheduleId) {
            generatedPrompt = buildSingleCallPrompt(
              text,
              (c as Extract<MessageTypes, { type: "schedule" }>).items,
            );
          }
        }
      }

      setPrompt("");
      await generateMessageResponse(text, generatedPrompt);
    },
    [conversation, generateMessageResponse, setPrompt],
  );

  const handleReview = () => {
    if (!selectedScheduleId) return;
    setModalVisible(true);
  };

  const handleConfirm = () => {
    setModalVisible(false);
    router.push("/confirmation");
  };

  const handleAddNewMessage = () => {
    handleSend(prompt);
  };

  // Derive the items for the currently selected schedule
  const selectedItems: ScheduleItem[] = (() => {
    if (!selectedScheduleId) return [];

    const turn = conversation.find(
      (t) =>
        t.id === selectedScheduleId &&
        t.role === "ai" &&
        (t as any).type === "schedule",
    ) as Extract<MessageTypes, { type: "schedule" }> | undefined;

    return turn?.items ?? [];
  })();

  // general chat prompt builder
  function buildSingleCallPrompt(userPrompt: string, schedule: ScheduleItem[]) {
    return `
    Answer the user's message using only the schedule below.

    SCHEDULE:
    ${schedule
      .map(
        (s) =>
          `- ${s.activity ?? "No activity"} (${s.start_time ?? "?"} - ${s.end_time ?? "?"})`,
      )
      .join("\n")}

    USER MESSAGE:
    "${userPrompt}"

    Rules:
    - If information is missing or unclear, say so.
    - Be concise and natural.
`;
  }

  return {
    router,
    prompt,
    setPrompt,
    handleSend,
    conversation,
    isStreaming,
    modalVisible,
    setModalVisible,
    selectedScheduleId,
    setSelectedScheduleId,
    questionScheduleId,
    setQuestionScheduleId,
    getQuestionScheduleNumberr,
    scrollRef,
    selectedItems,
    handleReview,
    handleConfirm,
    handleAddNewMessage,
    responseLoading,
    prevScheduleForm,
  };
};
