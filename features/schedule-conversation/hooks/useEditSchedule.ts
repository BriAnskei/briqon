import { useSchedule } from "@/context/ScheduleContext";
import { ScheduleItem } from "@/type/MessageTypes";
import { buildEditPrompt } from "@/features/schedule/utils/editSchedulePromptGenerator";
import { ItemUIState } from "../types/EditScheduleType";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Keyboard } from "react-native";

export const useEditSchedule = () => {
  const router = useRouter();
  const { editTarget, handleScheduleGeneration } = useSchedule();

  const [items] = useState<ScheduleItem[]>(editTarget?.items ?? []);
  const [itemStates, setItemStates] = useState<Record<number, ItemUIState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── State helpers (must be defined before handlers that call them) ─────────

  const getState = useCallback(
    (index: number): ItemUIState => itemStates[index] ?? { status: "idle" },
    [itemStates],
  );

  const setItemState = useCallback((index: number, next: ItemUIState) => {
    setItemStates((prev) => {
      const next_states: Record<number, ItemUIState> = {};

      Object.entries(prev).forEach(([k, v]) => {
        const i = Number(k);
        const shouldCollapseOtherEditing =
          i !== index && v.status === "editing";
        next_states[i] = shouldCollapseOtherEditing ? { status: "idle" } : v;
      });

      return { ...next_states, [index]: next };
    });
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLongPress = useCallback(
    (index: number) => {
      const current = getState(index);

      if (current.status === "pending_delete") return;

      if (current.status === "actions") {
        setItemState(index, { status: "idle" });
      } else if (current.status === "idle") {
        setItemState(index, { status: "actions" });
      } else if (current.status === "queued_edit") {
        setItemState(index, { status: "editing", prompt: current.prompt });
      }
    },
    [getState, setItemState],
  );

  const handleEditTap = useCallback(
    (index: number) => {
      setItemState(index, { status: "editing", prompt: "" });
    },
    [setItemState],
  );

  const handleDeleteTap = useCallback(
    (index: number) => {
      setItemState(index, { status: "pending_delete" });
    },
    [setItemState],
  );

  const handleUndoDelete = useCallback(
    (index: number) => {
      setItemState(index, { status: "idle" });
    },
    [setItemState],
  );

  const handleEditPromptChange = useCallback(
    (index: number, text: string) => {
      setItemState(index, { status: "editing", prompt: text });
    },
    [setItemState],
  );

  const handleEditDismiss = useCallback(
    (index: number) => {
      Keyboard.dismiss();
      setItemState(index, { status: "idle" });
    },
    [setItemState],
  );

  const handleApply = useCallback(
    (index: number, prompt: string) => {
      Keyboard.dismiss();
      setItemState(index, { status: "queued_edit", prompt });
    },
    [setItemState],
  );

  const handleDone = useCallback(async () => {
    const edits: { itemIndex: number; prompt: string }[] = [];
    const deletedIndices: number[] = [];

    Object.entries(itemStates).forEach(([k, v]) => {
      const i = Number(k);
      if (v.status === "queued_edit")
        edits.push({ itemIndex: i, prompt: v.prompt });
      else if (v.status === "pending_delete") deletedIndices.push(i);
    });

    if (edits.length === 0 && deletedIndices.length === 0) {
      router.back();
      return;
    }

    const scheduleStartTime = items[0]?.start_time ?? "00:00";
    const scheduleEndTime = items[items.length - 1]?.end_time ?? "23:59";

    setIsSubmitting(true);

    const prompt = buildEditPrompt(
      items,
      edits,
      deletedIndices,
      scheduleStartTime,
      scheduleEndTime,
    );

    try {
      handleScheduleGeneration(prompt, false);
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }, [itemStates, items, handleScheduleGeneration, router]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const hasChanges = Object.values(itemStates).some(
    (v) => v.status === "queued_edit" || v.status === "pending_delete",
  );

  return {
    // data
    items,
    itemStates,
    isSubmitting,
    hasChanges,
    // helpers
    getState,
    // handlers
    handleLongPress,
    handleEditTap,
    handleDeleteTap,
    handleUndoDelete,
    handleEditPromptChange,
    handleEditDismiss,
    handleApply,
    handleDone,

    // boolean
    editTarget,
  };
};
