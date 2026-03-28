import { useState } from "react";

export const useTextInput = () => {
  const [prompt, setPrompt] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const isInputFilled = prompt.trim().length > 10; // minimum input to send prompt

  return {
    prompt,
    setPrompt,
    isFocused,
    setIsFocused,
    isInputFilled,
  };
};
