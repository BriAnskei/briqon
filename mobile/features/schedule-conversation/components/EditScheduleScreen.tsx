import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Pressable,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRouter } from "expo-router";
import { Colors, Radius, Shadow } from "@/type/theme";
import { useSchedule } from "@/context/ScheduleContext";
import { ScheduleItem } from "@/type/MessageTypes";
import { duration, formatTime } from "@/utils/parseSchedule";
import { toneForIndex } from "../constants/tones";
import { buildEditPrompt } from "@/features/schedule/utils/editSchedulePromptGenerator";

// ─── Constants ────────────────────────────────────────────────────────────────

const CHAR_LIMIT = 200;
const countChars = (text: string): number => text.length;

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemUIState =
  | { status: "idle" }
  | { status: "actions" }
  | { status: "editing"; prompt: string }
  | { status: "queued_edit"; prompt: string } // prompt saved, awaiting Done
  | { status: "pending_delete" };

// ─── EditScheduleScreen ───────────────────────────────────────────────────────

export function EditScheduleScreen() {
  const router = useRouter();
  const { editTarget, handleEditSchedule } = useSchedule();

  const [items] = useState<ScheduleItem[]>(editTarget?.items ?? []);
  const [itemStates, setItemStates] = useState<Record<number, ItemUIState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── State helpers ─────────────────────────────────────────────────────────
  const getState = (index: number): ItemUIState =>
    itemStates[index] ?? { status: "idle" };

  const setItemState = useCallback((index: number, next: ItemUIState) => {
    console.log("settring item state: ", index, next);
    setItemStates((prev) => {
      const reset: Record<number, ItemUIState> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const i = Number(k);
        if (i !== index && v.status === "editing") {
          reset[i] = { status: "idle" };
        } else {
          reset[i] = v;
        }
      });
      return { ...reset, [index]: next };
    });
  }, []);

  useEffect(() => {
    console.log("Item states update: ", itemStates);
  }, [itemStates]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLongPress = (index: number) => {
    const current = getState(index);

    console.log("current: ", current);
    if (current.status === "pending_delete") return;
    if (current.status === "actions") {
      setItemState(index, { status: "idle" });
    } else if (current.status === "idle") {
      setItemState(index, { status: "actions" });
    } else if (current.status === "queued_edit") {
      // re-open input pre-filled with existing prompt so user can replace it
      setItemState(index, { status: "editing", prompt: current.prompt });
    }
  };

  const handleEditTap = (index: number) => {
    setItemState(index, { status: "editing", prompt: "" });
  };

  const handleDeleteTap = (index: number) => {
    setItemState(index, { status: "pending_delete" });
  };

  const handleUndoDelete = (index: number) => {
    setItemState(index, { status: "idle" });
  };

  const handleEditPromptChange = (index: number, text: string) => {
    setItemState(index, { status: "editing", prompt: text });
  };

  const handleEditDismiss = (index: number) => {
    Keyboard.dismiss();
    // if there was a previously queued prompt, restore it instead of going idle
    const current = getState(index);
    if (current.status === "editing" && current.prompt.trim()) {
      // user typed something but cancelled — discard and go idle
      setItemState(index, { status: "idle" });
    } else {
      setItemState(index, { status: "idle" });
    }
  };

  // Apply — saves prompt as queued_edit, collapses input
  const handleApply = (index: number, prompt: string) => {
    Keyboard.dismiss();
    setItemState(index, { status: "queued_edit", prompt });
  };

  // Done — batch all queued edits + deletes, call model, navigate back
  const handleDone = async () => {
    const edits: { itemIndex: number; prompt: string }[] = [];
    const deletedIndices: number[] = [];

    Object.entries(itemStates).forEach(([k, v]) => {
      const i = Number(k);
      if (v.status === "queued_edit") {
        edits.push({ itemIndex: i, prompt: v.prompt });
      } else if (v.status === "pending_delete") {
        deletedIndices.push(i);
      }
    });

    // nothing to do — just go back
    if (edits.length === 0 && deletedIndices.length === 0) {
      router.back();
      return;
    }

    // derive schedule bounds from first/last item
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
      await handleEditSchedule(prompt);
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const hasChanges = Object.values(itemStates).some(
    (v) => v.status === "queued_edit" || v.status === "pending_delete",
  );

  // ── Empty guard ───────────────────────────────────────────────────────────
  if (!editTarget) {
    return (
      <SafeAreaView style={s.root} edges={["top"]}>
        <View style={s.empty}>
          <Text style={s.emptyText}>No schedule selected for editing.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => !isSubmitting && router.back()}
          activeOpacity={0.7}
          style={[s.backBtn, isSubmitting && s.disabled]}
          disabled={isSubmitting}
        >
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Schedule</Text>
        <TouchableOpacity
          onPress={handleDone}
          activeOpacity={0.85}
          disabled={isSubmitting}
          style={[
            s.doneBtn,
            hasChanges && !isSubmitting && s.doneBtnActive,
            isSubmitting && s.doneBtnLoading,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={s.doneBtnText}>
              {hasChanges ? "Apply changes" : "Done"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Hint */}
      <View style={s.hint}>
        <Text style={s.hintText}>Long press any item to edit or delete it</Text>
      </View>

      <KeyboardAwareScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={24}
      >
        {items.map((item, index) => {
          const state = getState(index);
          const color = toneForIndex(index);
          const dur = duration(item.start_time!, item.end_time!);
          const isPendingDelete = state.status === "pending_delete";
          const isEditing = state.status === "editing";
          const showActions = state.status === "actions";
          const isQueued = state.status === "queued_edit";

          return (
            <View key={index} style={s.tlRow}>
              {/* Left time column */}
              <View style={s.tlLeft}>
                <Text style={[s.tlTime, isPendingDelete && s.deletedText]}>
                  {formatTime(item.start_time)}
                </Text>
                {index !== items.length - 1 && (
                  <View style={[s.tlLine, isPendingDelete && s.deletedLine]} />
                )}
              </View>

              {/* Dot */}
              <View
                style={[
                  s.tlDot,
                  {
                    backgroundColor: isPendingDelete
                      ? Colors.danger
                      : isQueued
                        ? Colors.accent
                        : color,
                  },
                ]}
              />

              {/* Right side: card + inline input */}
              <View style={s.tlRight}>
                <Pressable
                  onLongPress={() => handleLongPress(index)}
                  delayLongPress={300}
                  disabled={isSubmitting}
                  style={[
                    s.tlCard,
                    showActions && s.tlCardActive,
                    isEditing && s.tlCardEditing,
                    isPendingDelete && s.tlCardDeleted,
                    isQueued && s.tlCardQueued,
                  ]}
                >
                  <View style={s.cardTopRow}>
                    <View style={s.cardLeft}>
                      <View
                        style={[
                          s.categoryDot,
                          {
                            backgroundColor: isPendingDelete
                              ? Colors.danger
                              : isQueued
                                ? Colors.accent
                                : color,
                          },
                        ]}
                      />
                      <View style={s.tlBody}>
                        <Text
                          style={[s.tlTitle, isPendingDelete && s.deletedTitle]}
                        >
                          {item.activity}
                        </Text>
                        {dur ? (
                          <Text
                            style={[s.tlMeta, isPendingDelete && s.deletedText]}
                          >
                            {formatTime(item.start_time)} –{" "}
                            {formatTime(item.end_time)} · {dur}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    {/* Action icons — revealed on long press */}
                    {showActions && (
                      <View style={s.actionIcons}>
                        <TouchableOpacity
                          style={s.iconBtn}
                          onPress={() => handleEditTap(index)}
                          activeOpacity={0.7}
                        >
                          <Text style={s.iconEdit}>✎</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[s.iconBtn, s.iconBtnDelete]}
                          onPress={() => handleDeleteTap(index)}
                          activeOpacity={0.7}
                        >
                          <Text style={s.iconDelete}>🗑</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Deletion indicator */}
                    {isPendingDelete && (
                      <View style={s.deleteBadge}>
                        <Text style={s.deleteBadgeText}>To be removed</Text>
                        <TouchableOpacity
                          onPress={() => handleUndoDelete(index)}
                          activeOpacity={0.7}
                          style={s.undoBtn}
                          disabled={isSubmitting}
                        >
                          <Text style={s.undoBtnText}>Undo</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </Pressable>

                {/* Queued edit prompt badge — shown below card after Apply */}
                {isQueued && state.status === "queued_edit" && (
                  <View style={s.queuedBadge}>
                    <Text style={s.queuedBadgeIcon}>✎</Text>
                    <Text style={s.queuedBadgeText} numberOfLines={2}>
                      {state.prompt}
                    </Text>
                  </View>
                )}

                {/* Inline edit input — expands below card */}
                {isEditing && (
                  <View style={s.editInputContainer}>
                    <View style={s.editInputInner}>
                      <TextInput
                        style={s.editInput}
                        placeholder={`What do you want to change about "${item.activity}"?`}
                        placeholderTextColor={Colors.textMuted}
                        value={state.status === "editing" ? state.prompt : ""}
                        onChangeText={(t) => {
                          if (countChars(t) <= CHAR_LIMIT) {
                            handleEditPromptChange(index, t);
                          }
                        }}
                        multiline
                        autoFocus
                        returnKeyType="done"
                        submitBehavior="blurAndSubmit"
                      />
                      <View style={s.wordCountRow}>
                        <Text
                          style={[
                            s.wordCount,
                            state.status === "editing" &&
                              countChars(state.prompt) >= CHAR_LIMIT &&
                              s.wordCountLimit,
                          ]}
                        >
                          {state.status === "editing"
                            ? countChars(state.prompt)
                            : 0}
                          /{CHAR_LIMIT} chars
                        </Text>
                      </View>
                      <View style={s.editInputActions}>
                        <TouchableOpacity
                          onPress={() => handleEditDismiss(index)}
                          activeOpacity={0.7}
                          style={s.cancelBtn}
                        >
                          <Text style={s.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            s.submitBtn,
                            state.status === "editing" &&
                              !state.prompt.trim() &&
                              s.submitBtnDisabled,
                          ]}
                          onPress={() => {
                            if (
                              state.status === "editing" &&
                              state.prompt.trim()
                            ) {
                              handleApply(index, state.prompt.trim());
                            }
                          }}
                          activeOpacity={0.85}
                          disabled={
                            state.status === "editing" &&
                            (!state.prompt.trim() ||
                              countChars(state.prompt) > CHAR_LIMIT)
                          }
                        >
                          <Text style={s.submitBtnText}>Apply</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        <View style={s.bottomSpacer} />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  disabled: { opacity: 0.4 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 22, color: Colors.textSecondary },
  headerTitle: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary },
  doneBtn: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: "center",
  },
  doneBtnActive: {
    backgroundColor: Colors.accent,
    ...Shadow.accent,
  },
  doneBtnLoading: {
    backgroundColor: Colors.accent,
    opacity: 0.7,
  },
  doneBtnText: { fontSize: 13, fontWeight: "600", color: Colors.white },

  hint: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgElevated,
  },
  hintText: { fontSize: 12, color: Colors.textMuted, textAlign: "center" },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },

  tlRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  tlLeft: {
    width: 64,
    alignItems: "flex-end",
    paddingRight: 14,
    paddingTop: 10,
  },
  tlTime: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  tlLine: {
    width: 1,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: 8,
    minHeight: 28,
  },
  tlDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 12,
    marginRight: 14,
  },
  tlRight: { flex: 1 },

  tlCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tlCardActive: { borderColor: Colors.accent, borderWidth: 1.5 },
  tlCardEditing: {
    borderColor: Colors.accent,
    borderWidth: 1.5,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  tlCardDeleted: {
    backgroundColor: Colors.dangerSoft,
    borderColor: Colors.danger,
    borderWidth: 1.5,
    opacity: 0.75,
  },
  tlCardQueued: {
    borderColor: Colors.accent,
    borderWidth: 1.5,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  categoryDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  tlBody: { flex: 1 },
  tlTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  tlMeta: { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },

  deletedTitle: { color: Colors.danger, textDecorationLine: "line-through" },
  deletedText: { color: Colors.danger, textDecorationLine: "line-through" },
  deletedLine: { backgroundColor: Colors.danger, opacity: 0.4 },

  deleteBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },
  deleteBadgeText: { fontSize: 11, color: Colors.danger, fontWeight: "500" },
  undoBtn: {
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  undoBtnText: { fontSize: 11, color: Colors.danger, fontWeight: "600" },

  // Queued edit badge — appears below card after Apply
  queuedBadge: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: Colors.accentSoft,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Colors.accent,
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  queuedBadgeIcon: {
    fontSize: 12,
    color: Colors.accent,
    marginTop: 1,
  },
  queuedBadgeText: {
    flex: 1,
    fontSize: 12,
    color: Colors.accent,
    fontWeight: "500",
    lineHeight: 17,
  },

  actionIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnDelete: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerSoft,
  },
  iconEdit: { fontSize: 14 },
  iconDelete: { fontSize: 13 },

  editInputContainer: { marginBottom: 10 },
  editInputInner: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: Colors.accent,
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  editInput: {
    fontSize: 13,
    color: Colors.textPrimary,
    minHeight: 40,
    maxHeight: 100,
    textAlignVertical: "top",
  },
  wordCountRow: {
    alignItems: "flex-end",
    marginTop: 4,
    marginBottom: 2,
  },
  wordCount: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  wordCountLimit: {
    color: Colors.danger,
    fontWeight: "600",
  },
  editInputActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    ...Shadow.accent,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.bgElevated,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: { fontSize: 12, fontWeight: "600", color: Colors.white },

  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 14, color: Colors.textMuted },
  bottomSpacer: { height: 40 },
});
