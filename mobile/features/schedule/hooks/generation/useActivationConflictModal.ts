import { useCallback, useEffect, useState } from "react";
import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";

export function useActivationConflictModal(conflicts: ScheduleConflict[]) {
  const [expandedConflictId, setExpandedConflictId] = useState<string | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const toggleExpand = useCallback((id: string) => {
    setExpandedConflictId((prev) => (prev === id ? null : id));
  }, []);

  const openInfoModal = useCallback(() => setIsInfoModalOpen(true), []);
  const closeInfoModal = useCallback(() => setIsInfoModalOpen(false), []);

  // New batch of conflicts (or modal closing → conflicts: []) should never
  // carry over a stale expanded card from the previous attempt.
  useEffect(() => {
    if (!conflicts) return;

    setExpandedConflictId(null);
  }, [conflicts]);

  return {
    expandedConflictId,
    toggleExpand,
    isInfoModalOpen,
    openInfoModal,
    closeInfoModal,
  };
}
