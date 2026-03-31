import { useEffect, useState } from "react";
import { useTextInput } from "./useInput";
import { MessageTypes } from "@/type/MessageTypes";
import { useSchedule } from "@/context/ScheduleContext";

export const useScheduleScreen = () => {
  const { generate, currentModeRef, conversation } = useSchedule();

  const { prompt, setPrompt } = useTextInput();

  const addNewMessage = (newMessage: MessageTypes) => {};

  const handleSend = async (text: string) => {
    const newMessage: Extract<MessageTypes, { role: "user" }> = {
      id: Date.now().toString(),
      text,
      role: "user",
    };

    addNewMessage(newMessage);

    await generate(text);
  };

  return {
    prompt,
    setPrompt,
    handleSend,
    conversation,
  };
};
