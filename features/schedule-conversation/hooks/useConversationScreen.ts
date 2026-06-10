import { useCallback, useEffect, useRef, useState } from "react";
import { useTextInput } from "../../../hooks/useInput";
import { MessageTypes, ScheduleItem } from "@/type/MessageTypes";
import { useSchedule } from "@/context/ScheduleContext";
import { ScrollView } from "react-native";
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
    setSelectedReviewItems, // ← stage items before navigating
  } = useSchedule();

  const { prompt, setPrompt } = useTextInput();

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );
  const [questionScheduleId, setQuestionScheduleId] = useState<string | null>(
    null,
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (conversation.length === 0) return;
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timeout);
  }, [conversation]);

  // ── Derived: items for the currently selected schedule ────────────────────
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

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getQuestionScheduleNumber = () => {
    let numberOfSched = 0;
    for (const c of conversation) {
      if (c.role === "ai" && c.type === "schedule") {
        numberOfSched++;
        if (c.id === questionScheduleId) return numberOfSched;
      }
    }
    return null;
  };

  function buildSingleCallPrompt(userPrompt: string, schedule: ScheduleItem[]) {
    return `
CONTEXT:
You must answer using ONLY the schedule below.

SCHEDULE:
${schedule
  .map(
    (s) =>
      `- ${s.activity ?? "No activity"} (${s.start_time ?? "?"} - ${s.end_time ?? "?"})`,
  )
  .join("\n")}

USER MESSAGE:
"${userPrompt}"

CONTEXT RULES:
- Only use the provided schedule.
- If information is missing or unclear, say so.
- Be concise and natural.
`;
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (text: string) => {
      let generatedPrompt: string | undefined;

      if (questionScheduleId) {
        for (const c of conversation) {
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
    [conversation, generateMessageResponse, setPrompt, questionScheduleId],
  );

  const handleAddNewMessage = () => handleSend(prompt);

  /**
   * Stage the selected schedule items in context then navigate.
   * review.tsx reads them from useSchedule() — no URL params needed.
   */
  const handleReview = () => {
    if (!selectedScheduleId || isStreaming) return;
    setSelectedReviewItems(selectedItems);
    router.push("/schedule/review");
  };

  return {
    router,
    prompt,
    setPrompt,
    handleSend,
    handleAddNewMessage,
    handleReview,
    conversation,
    isStreaming,
    responseLoading,
    prevScheduleForm,
    selectedScheduleId,
    setSelectedScheduleId,
    questionScheduleId,
    setQuestionScheduleId,
    getQuestionScheduleNumber,
    scrollRef,
    selectedItems,
  };
};
