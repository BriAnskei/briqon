import { useState, useCallback } from "react";
import { ConflicActivationError } from "@/src/errors/scheduleActivationConflic.error";

interface UseConflictActivationModalResult {
  isVisible: boolean;

  conflictError: ConflicActivationError | null;

  openConflictModal: (error: ConflicActivationError) => void;

  closeConflictModal: () => void;
}

export function useConflictActivationModal(): UseConflictActivationModalResult {
  const [conflictError, setConflictError] =
    useState<ConflicActivationError | null>(null);

  const isVisible = conflictError !== null;

  const openConflictModal = useCallback((error: ConflicActivationError) => {
    setConflictError(error);
  }, []);

  const closeConflictModal = useCallback(() => {
    setConflictError(null);
  }, []);

  return {
    isVisible,
    conflictError,
    openConflictModal,
    closeConflictModal,
  };
}
