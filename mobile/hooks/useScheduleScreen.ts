import { useEffect, useRef, useState } from "react";
import { useTextInput } from "./useInput";
import { MessageTypes } from "@/type/MessageTypes";
import { useSchedule } from "@/context/ScheduleContext";
import { ScrollView } from "react-native";
import { ScheduleItem } from "@/type/MessageTypes";
import { useRouter } from "expo-router";

export const useScheduleScreen = () => {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const { generate, currentModeRef, conversation, isStreaming } = useSchedule();
  const { prompt, setPrompt } = useTextInput();

  const [modalVisible, setModalVisible] = useState(false);

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );

  const handleSend = async (text: string) => {
    await generate(text);
    setPrompt("");
  };

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
  };
};
