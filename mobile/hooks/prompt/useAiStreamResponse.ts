import { use, useState } from "react";

export const useAiStreamResponse = () => {
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [response, setResponse] = useState("");

  return {
    response,
    setResponse,
    isStreaming,
    setIsStreaming,
    loading,
    setLoading,
  };
};
