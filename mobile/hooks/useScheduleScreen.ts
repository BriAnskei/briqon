import { useCallback, useEffect, useRef, useState } from "react";
import { useTextInput } from "./useInput";
import { MessageTypes } from "@/type/MessageTypes";
import { useSchedule } from "@/context/ScheduleContext";
import { ScrollView } from "react-native";
import { ScheduleItem } from "@/type/MessageTypes";
import { useRouter } from "expo-router";

export const useScheduleScreen = () => {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const {
    generateMessageResponse,
    conversation,
    isStreaming,
    responseLoading,
  } = useSchedule();
  const { prompt, setPrompt } = useTextInput();

  const [modalVisible, setModalVisible] = useState(false);

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (conversation.length === 0) return;
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timeout);
  }, [conversation]);

  const handleSend = useCallback(async (text: string) => {
    setPrompt("");
    await generateMessageResponse(text);
  }, []);

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
    scrollRef,
    selectedItems,
    handleReview,
    handleConfirm,
    handleAddNewMessage,
    responseLoading,
  };
};
