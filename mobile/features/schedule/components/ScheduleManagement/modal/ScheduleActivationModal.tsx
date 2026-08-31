import { Check, Pencil, Trash2, X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import type { ScheduleItem } from "@/src/models/schedule.model";
import type { SubSummary } from "@/src/models/sub_summaries.model";
import type { ScheduleSummary } from "@/src/models/summaries.model";
import { ComponentSize, FontFamily, Radius } from "@/type/theme";
import { ScheduleTimeline } from "../../GenerateScheduleScreen/components/ScheduleTimeline";
import { SummaryCard } from "../../GenerateScheduleScreen/components/SummaryCard";

export interface ActivationScheduleInput {
  id?: string; // undefined => not saved yet
  name: string; // "" allowed for unsaved drafts
  schedule_list: ScheduleItem[];
  /**
   * Indexes into `schedule_list` that are currently turned off. Optional —
   * absent/empty means every item is active. Seeds the edit-mode toggle
   * state; persistence of this is up to the caller (see onSaveEdits).
   */
  disabledItemIndexes?: number[];
}

export interface ScheduleEditPayload {
  name: string;
  disabledItemIndexes: number[];
}

interface ScheduleActivationModalProps {
  visible: boolean;
  onClose: () => void;
  schedule: ActivationScheduleInput | null;
  isActive: boolean;
  onSave: () => void;
  onRename: (name: string) => void;
  /**
   * Commits an edit-mode session: the (possibly changed) name and the set
   * of item indexes the user turned off. Called once, when the user taps
   * Save in edit mode — not on every keystroke/toggle.
   */
  onSaveEdits?: (payload: ScheduleEditPayload) => void;
  /**
   * Opens the activation-configuration flow (SetActiveModal). This is the
   * single entry point for both "Set as Active" (no prior config) and
   * "Edit Activation" (reconfiguring an existing one) — the modal itself
   * decides which copy/seed to show based on whether an activation already
   * exists, so the caller doesn't need two separate handlers.
   */
  onConfigureActivation: () => void;
  /**
   * Permanently removes this schedule (and its activation, if any). Always
   * rendered regardless of save state or activation configuration — the
   * confirm step (native destructive Alert) is handled here; the caller
   * implements the actual deletion.
   */
  onDelete: () => void;
}

function buildMockSummary(schedule_list: ScheduleItem[]): {
  summaries: ScheduleSummary[];
  subSummaries: SubSummary[];
} {
  const summaryId = "mock-cat-1";
  const summaries = [
    { id: summaryId, name: "Activities", total: `${schedule_list.length}` },
  ] as unknown as ScheduleSummary[];
  const subSummaries = schedule_list.map((item, idx) => ({
    id: `mock-sub-${idx}`,
    summary_id: summaryId,
    name: item.activity,
    total: `${item.start_time}–${item.end_time}`,
  })) as unknown as SubSummary[];
  return { summaries, subSummaries };
}

export function ScheduleActivationModal({
  visible,
  onClose,
  schedule,
  isActive,
  onSave,
  onRename,
  onSaveEdits,
  onConfigureActivation,
  onDelete,
}: ScheduleActivationModalProps) {
  // --- All hooks run unconditionally, every render, regardless of whether
  // `schedule` is null. Never put a hook after an early return. ---
  const s = useSStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [nameDraft, setNameDraft] = useState(schedule?.name ?? "");

  // Edit mode: renaming + toggling items is an explicit, committed session
  // (Cancel discards, Save commits both together) rather than always-on
  // inline editing — this avoids the keyboard popping up or a name
  // half-changing just because someone tapped a toggle.
  const [isEditing, setIsEditing] = useState(false);
  const [disabledIndexes, setDisabledIndexes] = useState<Set<number>>(new Set());

  // Resync local edit state whenever a different schedule is opened
  // (previously this only ran once via useState's initializer, so reopening
  // the modal on a different schedule would show stale text). Also bails
  // out of any in-progress edit session so stale drafts never leak across
  // schedules.
  useEffect(() => {
    setNameDraft(schedule?.name ?? "");
    setDisabledIndexes(new Set(schedule?.disabledItemIndexes ?? []));
    setIsEditing(false);
  }, [schedule?.id, schedule?.name, schedule?.disabledItemIndexes]);

  const { summaries, subSummaries } = useMemo(
    () => buildMockSummary(schedule?.schedule_list ?? []),
    [schedule?.schedule_list],
  );

  // Guard AFTER all hooks have been called.
  if (!schedule) return null;

  const isSaved = !!schedule.id;
  const displayName = schedule.name || "Untitled Schedule";
  const activeCount = schedule.schedule_list.length - disabledIndexes.size;

  const handleDeletePress = () => {
    // Native destructive confirmation — required before any irreversible
    // action, per RN Alert conventions (explicit Cancel, destructive style).
    // Copy is deliberately the same regardless of save state or whether an
    // activation exists — deleting always drops both together.
    Alert.alert(
      "Delete Schedule",
      `"${displayName}" will be permanently deleted${
        isActive ? ", including its active schedule" : ""
      }. This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: onDelete, // caller implements the actual deletion
        },
      ],
    );
  };

  const handleStartEdit = () => {
    setNameDraft(schedule.name);
    setDisabledIndexes(new Set(schedule.disabledItemIndexes ?? []));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Discard: revert local drafts back to the schedule's last known state.
    setNameDraft(schedule.name);
    setDisabledIndexes(new Set(schedule.disabledItemIndexes ?? []));
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    onRename(nameDraft);
    onSaveEdits?.({ name: nameDraft, disabledItemIndexes: Array.from(disabledIndexes) });
    setIsEditing(false);
  };

  const toggleItemIndex = (idx: number) => {
    setDisabledIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={isEditing ? handleCancelEdit : onClose}
    >
      <View style={s.backdrop}>
        <Pressable
          style={s.backdropPress}
          onPress={isEditing ? handleCancelEdit : onClose}
        />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          {/* Header */}
          {isEditing ? (
            // Edit-mode header: Cancel/Save replace the normal name+close
            // chrome entirely (iOS convention — a Save/Done control always
            // sits top-right, and Cancel moves to top-left once paired with
            // it), so there's no ambiguity about what tapping X would do
            // to unsaved changes.
            <View style={s.editHeader}>
              <Pressable onPress={handleCancelEdit} hitSlop={8}>
                <Text style={s.editHeaderCancel}>Cancel</Text>
              </Pressable>
              <Text style={s.editHeaderTitle}>Edit Schedule</Text>
              <Pressable onPress={handleSaveEdit} hitSlop={8} style={s.editHeaderSaveBtn}>
                <Check size={14} color={colors.white} />
                <Text style={s.editHeaderSaveText}>Save</Text>
              </Pressable>
            </View>
          ) : (
            <View style={s.sheetHeader}>
              <View style={s.nameGroup}>
                <Text style={isSaved ? s.nameText : s.namePlaceholder}>
                  {displayName}
                </Text>
                <View style={s.tagRow}>
                  {!isSaved && (
                    <View style={s.unsavedTag}>
                      <Text style={s.unsavedTagText}>Unsaved</Text>
                    </View>
                  )}
                  {isActive && (
                    <View style={s.activeTag}>
                      <View style={s.activeDot} />
                      <Text style={s.activeTagText}>Active</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={s.headerIconGroup}>
                <Pressable onPress={handleStartEdit} hitSlop={8} style={s.headerIconBtn}>
                  <Pencil size={18} color={colors.textSecondary} />
                </Pressable>
                <Pressable onPress={onClose} hitSlop={8} style={s.headerIconBtn}>
                  <X size={22} color={colors.textMuted} />
                </Pressable>
              </View>
            </View>
          )}

          {/* Body */}
          {isEditing ? (
            <ScrollView
              style={s.body}
              contentContainerStyle={s.bodyContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View>
                <Text style={s.editFieldLabel}>Name</Text>
                <TextInput
                  style={s.editNameInput}
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  placeholder="Schedule name"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                />
              </View>

              <View>
                <View style={s.editFieldLabelRow}>
                  <Text style={s.editFieldLabel}>Activities</Text>
                  <Text style={s.editFieldCount}>
                    {activeCount} of {schedule.schedule_list.length} active
                  </Text>
                </View>
                <View style={s.editItemList}>
                  {schedule.schedule_list.map((item, idx) => {
                    const disabled = disabledIndexes.has(idx);
                    return (
                      <View
                        key={idx}
                        style={[s.editItemRow, disabled && s.editItemRowDisabled]}
                      >
                        <View style={s.editItemTextGroup}>
                          <Text
                            style={[s.editItemTime, disabled && s.editItemTextDisabled]}
                          >
                            {item.start_time}–{item.end_time}
                          </Text>
                          <Text
                            style={[
                              s.editItemActivity,
                              disabled && s.editItemTextDisabled,
                              disabled && s.editItemTextStrike,
                            ]}
                          >
                            {item.activity}
                          </Text>
                        </View>
                        <Switch
                          value={!disabled}
                          onValueChange={() => toggleItemIndex(idx)}
                          trackColor={{ false: colors.bgElevated, true: colors.accent }}
                          thumbColor={colors.white}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          ) : (
            <ScrollView
              style={s.body}
              contentContainerStyle={s.bodyContent}
              showsVerticalScrollIndicator={false}
            >
              <SummaryCard summaries={summaries} subSummaries={subSummaries} />
              <ScheduleTimeline schedule={schedule.schedule_list} />
            </ScrollView>
          )}

          {/* Manage row and primary actions are hidden while editing — the
              edit session has its own committed Save/Cancel above, and
              surfacing Delete/Activate alongside an in-progress rename
              invites tapping the wrong thing. */}
          {!isEditing && (
            <>
              <View style={s.manageRow}>
                {isActive && (
                  <Pressable
                    style={s.manageBtn}
                    onPress={onConfigureActivation}
                    hitSlop={6}
                  >
                    <Pencil size={15} color={colors.textSecondary} />
                    <Text style={s.manageBtnText}>Edit Activation</Text>
                  </Pressable>
                )}
                <Pressable
                  style={[s.manageBtn, s.deleteBtn, !isActive && s.deleteBtnFull]}
                  onPress={handleDeletePress}
                  hitSlop={6}
                >
                  <Trash2 size={15} color={colors.danger ?? "#E5484D"} />
                  <Text style={[s.manageBtnText, s.deleteBtnText]}>Delete</Text>
                </Pressable>
              </View>

              <View style={s.actionRow}>
                {!isSaved && (
                  <Pressable style={[s.actionBtn, s.saveBtn]} onPress={onSave}>
                    <Text style={s.saveBtnText}>Save Schedule</Text>
                  </Pressable>
                )}
                {!isActive && (
                  // "Set as Active" opens the same activation-configuration
                  // modal as "Edit Activation" above — there is no prior
                  // config to seed from yet, so the modal opens blank.
                  <Pressable
                    style={[s.actionBtn, s.activateBtn, !isSaved && s.actionBtnSecondary]}
                    onPress={onConfigureActivation}
                  >
                    <Text
                      style={[s.activateBtnText, !isSaved && s.activateBtnTextSecondary]}
                    >
                      Set as Active
                    </Text>
                  </Pressable>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function useSStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.4)",
        },
        backdropPress: { flex: 1 },
        sheet: {
          backgroundColor: colors.bgModal,
          borderTopLeftRadius: ComponentSize.modalTopRadius,
          borderTopRightRadius: ComponentSize.modalTopRadius,
          paddingTop: 16,
          paddingHorizontal: 20,
          maxHeight: "85%",
        },
        sheetHeader: {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 16,
        },
        nameGroup: { flex: 1, gap: 8, marginRight: 12 },
        nameText: {
          fontSize: 18,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
          color: colors.textPrimary,
        },
        namePlaceholder: {
          fontSize: 18,
          fontFamily: FontFamily.body,
          fontWeight: "400",
          fontStyle: "italic",
          color: colors.textMuted,
        },
        headerIconGroup: { flexDirection: "row", alignItems: "center", gap: 4 },
        headerIconBtn: { padding: 2 },
        tagRow: { flexDirection: "row", gap: 8 },
        unsavedTag: {
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: Radius.full,
          backgroundColor: colors.bgElevated,
        },
        unsavedTagText: {
          fontSize: 11,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.textMuted,
        },
        activeTag: { flexDirection: "row", alignItems: "center", gap: 5 },
        activeDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.accent,
        },
        activeTagText: {
          fontSize: 11,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.accent,
        },
        body: { flexGrow: 0 },
        bodyContent: { gap: 16, paddingBottom: 8 },

        // --- edit mode header ---
        editHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        },
        editHeaderCancel: {
          fontSize: 15,
          fontFamily: FontFamily.body,
          fontWeight: "400",
          color: colors.textSecondary,
        },
        editHeaderTitle: {
          fontSize: 15,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
          color: colors.textPrimary,
        },
        editHeaderSaveBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: Radius.full,
          backgroundColor: colors.accent,
        },
        editHeaderSaveText: {
          fontSize: 13,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
          color: colors.white,
        },

        // --- edit mode body ---
        editFieldLabel: {
          fontSize: 12,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          marginBottom: 8,
        },
        editFieldLabelRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        },
        editFieldCount: {
          fontSize: 12,
          fontFamily: FontFamily.mono,
          fontWeight: "400",
          color: colors.textMuted,
        },
        editNameInput: {
          fontSize: 16,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.textPrimary,
          backgroundColor: colors.bgElevated,
          borderRadius: Radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        editItemList: {
          borderRadius: Radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          overflow: "hidden",
        },
        editItemRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
          backgroundColor: colors.bgCard,
        },
        editItemRowDisabled: { backgroundColor: colors.bgElevated },
        editItemTextGroup: { flex: 1, gap: 2 },
        editItemTime: {
          fontSize: 12,
          fontFamily: FontFamily.mono,
          fontWeight: "400",
          color: colors.textSecondary,
        },
        editItemActivity: {
          fontSize: 14,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.textPrimary,
        },
        editItemTextDisabled: { color: colors.textMuted },
        editItemTextStrike: { textDecorationLine: "line-through" },

        // --- manage row (edit activation / delete) ---
        manageRow: {
          flexDirection: "row",
          gap: 8,
          marginTop: 16,
          paddingTop: 14,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        manageBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          flex: 1,
          paddingVertical: 10,
          borderRadius: Radius.md,
          backgroundColor: colors.bgElevated,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        manageBtnText: {
          fontSize: 13,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.textSecondary,
        },
        deleteBtn: {
          borderColor: colors.danger ?? "#E5484D",
        },
        deleteBtnText: {
          color: colors.danger ?? "#E5484D",
        },

        actionRow: { flexDirection: "row", gap: 10, marginTop: 16 },
        actionBtn: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: ComponentSize.primaryBtnVerticalPadding,
          borderRadius: Radius.md,
        },
        actionBtnSecondary: { flex: 0.8 },
        saveBtn: { backgroundColor: colors.accent },
        saveBtnText: {
          fontSize: 14,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
          color: colors.white,
        },
        activateBtn: { backgroundColor: colors.accent },
        activateBtnText: {
          fontSize: 14,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
          color: colors.white,
        },
        activateBtnTextSecondary: { color: colors.accent },
      }),
    [colors],
  );
}
