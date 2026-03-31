import { use, useState } from "react";

export const useAiStreamResponse = () => {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState<number | undefined>(undefined);

  return {
    response,
    setResponse,
    isStreaming,
    setIsStreaming,
    loading,
    setLoading,
    mode,
    setMode,
  };
};
