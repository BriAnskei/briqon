import { X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
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
}

interface ScheduleActivationModalProps {
  visible: boolean;
  onClose: () => void;
  schedule: ActivationScheduleInput | null;
  isActive: boolean;
  onSave: () => void;
  onSetActive: () => void;
  onRename: (name: string) => void;
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
  onSetActive,
  onRename,
}: ScheduleActivationModalProps) {
  // --- All hooks run unconditionally, every render, regardless of whether
  // `schedule` is null. Never put a hook after an early return. ---
  const s = useSStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [nameDraft, setNameDraft] = useState(schedule?.name ?? "");

  // Resync the local name draft whenever a different schedule is opened
  // (previously this only ran once via useState's initializer, so reopening
  // the modal on a different schedule would show stale text).
  useEffect(() => {
    setNameDraft(schedule?.name ?? "");
  }, [schedule?.id, schedule?.name]);

  const { summaries, subSummaries } = useMemo(
    () => buildMockSummary(schedule?.schedule_list ?? []),
    [schedule?.schedule_list],
  );

  // Guard AFTER all hooks have been called.
  if (!schedule) return null;

  const isSaved = !!schedule.id;
  const displayName = schedule.name || "Untitled Schedule";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <Pressable style={s.backdropPress} onPress={onClose} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          {/* Header */}
          <View style={s.sheetHeader}>
            <View style={s.nameGroup}>
              {isSaved ? (
                <TextInput
                  style={s.nameInput}
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  onEndEditing={() => onRename(nameDraft)}
                  placeholder="Schedule name"
                  placeholderTextColor={colors.textMuted}
                />
              ) : (
                <Text style={s.namePlaceholder}>{displayName}</Text>
              )}
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
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView
            style={s.body}
            contentContainerStyle={s.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            <SummaryCard summaries={summaries} subSummaries={subSummaries} />
            <ScheduleTimeline schedule={schedule.schedule_list} />
          </ScrollView>

          {/* Actions */}
          <View style={s.actionRow}>
            {!isSaved && (
              <Pressable style={[s.actionBtn, s.saveBtn]} onPress={onSave}>
                <Text style={s.saveBtnText}>Save Schedule</Text>
              </Pressable>
            )}
            {!isActive && (
              <Pressable
                style={[s.actionBtn, s.activateBtn, !isSaved && s.actionBtnSecondary]}
                onPress={onSetActive}
              >
                <Text style={[s.activateBtnText, !isSaved && s.activateBtnTextSecondary]}>
                  Set as Active
                </Text>
              </Pressable>
            )}
          </View>
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
        nameInput: {
          fontSize: 18,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
          color: colors.textPrimary,
          padding: 0,
        },
        namePlaceholder: {
          fontSize: 18,
          fontFamily: FontFamily.body,
          fontWeight: "400",
          fontStyle: "italic",
          color: colors.textMuted,
        },
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
