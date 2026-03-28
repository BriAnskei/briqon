import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { useTextInput } from "../useInput";
import { useRouter } from "expo-router";
import { useSchedule } from "@/context/ScheduleContext";

const EXAMPLE_PROMPT =
  "I want to start my day with full productivity. I have a work schedule from 6am–3pm, I want to go to the gym after work for a 2 hour session, and use the rest of the time to study programming and upskill.";

export const useIndexGenerateInput = () => {
  const router = useRouter();
  const { generate, responseLoading, isStreaming } = useSchedule();

  const generateButtonScale = useRef(new Animated.Value(1)).current;

  const {
    prompt,
    setPrompt,
    isFocused,
    setIsFocused,
    isInputFilled: canGenerate,
  } = useTextInput();

  useEffect(() => {
    if (!responseLoading && isStreaming) {
      router.push("/schedule");
    }
  }, [responseLoading, isStreaming]);

  const handleGenerate = () => {
    if (responseLoading) return;

    Animated.sequence([
      Animated.timing(generateButtonScale, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(generateButtonScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    generate(prompt);
  };

  const handleExamplePrompt = () => {
    setPrompt(EXAMPLE_PROMPT);
  };

  return {
    prompt,
    setPrompt,
    isFocused,
    setIsFocused,
    canGenerate,
    // Keep the same shape HomeScreen expects
    loading: responseLoading,
    handleGenerate,
    handleExamplePrompt,
    generateButtonScale,
  };
};
