import { AlertTriangle, HelpCircle } from "lucide-react-native";
import { useMemo, useRef } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { useActivationConflictModal } from "@/features/schedule/hooks/generation/useActivationConflictModal";
import { DAYS } from "@/features/schedule/hooks/generation/useSetActiveModal";
import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";
import { Colors, Radius } from "@/type/theme";
import { formatCompact, isSameDay } from "@/utils/TimeFormatter";
import { ResolveInfoPopover } from "../components/ResolveInfoPopover";

interface ActivationConflictModalProp {
  isConflictModalOpen: boolean;
  conflicts: ScheduleConflict[];
  activationDayIndices: number[];
  isResolvingConflict: boolean;
  handleCancelConflicts: () => void;
  handleResolveConflicts: () => Promise<void>;
}

export function ActivationConflictModal({
  isConflictModalOpen,
  conflicts,
  activationDayIndices,
  isResolvingConflict,
  handleCancelConflicts,
  handleResolveConflicts,
}: ActivationConflictModalProp) {
  const s = useCStyles();
  const infoButtonRef = useRef(null);
  const {
    expandedConflictId,
    toggleExpand,
    isInfoModalOpen,
    openInfoModal,
    closeInfoModal,
  } = useActivationConflictModal(conflicts);

  return (
    <Modal
      visible={isConflictModalOpen}
      animationType="fade"
      transparent
      onRequestClose={handleCancelConflicts}
      statusBarTranslucent
    >
      <View style={s.overlay}>
        <View style={s.modalCard}>
          <View style={s.header}>
            <View style={s.headerTop}>
              <View style={s.titleRow}>
                <View style={s.titleIconWrap}>
                  <AlertTriangle
                    size={16}
                    color={Colors.danger ?? "#E5484D"}
                    strokeWidth={2.25}
                  />
                </View>
                <Text style={s.title}>Schedule Conflicts</Text>
              </View>
              <TouchableOpacity
                ref={infoButtonRef}
                onPress={openInfoModal}
                style={s.infoBtn}
                activeOpacity={0.8}
              >
                <HelpCircle size={16} color={Colors.accent} strokeWidth={2.25} />
              </TouchableOpacity>
            </View>
            <Text style={s.subtitle}>
              {conflicts.length} existing schedule
              {conflicts.length > 1 ? "s" : ""} overlap with this activation
            </Text>
          </View>

          <ScrollView
            style={s.scrollArea}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {conflicts.map((conflict) => (
              <ConflictCard
                key={conflict.id}
                conflict={conflict}
                activationDayIndices={activationDayIndices}
                isExpanded={expandedConflictId === conflict.id}
                onToggle={() => toggleExpand(conflict.id)}
              />
            ))}
          </ScrollView>

          <View style={s.actions}>
            <TouchableOpacity
              style={s.cancelBtn}
              onPress={handleCancelConflicts}
              activeOpacity={0.8}
              disabled={isResolvingConflict}
            >
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.resolveBtn, isResolvingConflict && s.resolveBtnDisabled]}
              onPress={handleResolveConflicts}
              activeOpacity={0.88}
              disabled={isResolvingConflict}
            >
              <Text style={s.resolveText}>
                {isResolvingConflict ? "Resolving…" : "Resolve & Activate"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <ResolveInfoPopover
          isOpen={isInfoModalOpen}
          onClose={closeInfoModal}
          fromRef={infoButtonRef}
        />
      </View>
    </Modal>
  );
}

function ConflictCard({
  conflict,
  activationDayIndices,
  isExpanded,
  onToggle,
}: {
  conflict: ScheduleConflict;
  activationDayIndices: number[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const s = useCStyles();

  const conflictingDayIndices = useMemo(() => {
    if (!conflict.selectedDays) return [];
    return conflict.selectedDays.filter((d) => activationDayIndices.includes(d));
  }, [conflict.selectedDays, activationDayIndices]);

  const dateLabel = useMemo(() => {
    if (!conflict.startsAt) return conflict.selectedDate ?? "";
    const end = conflict.endsAt ?? conflict.startsAt;
    return isSameDay(conflict.startsAt, end)
      ? formatCompact(conflict.startsAt)
      : `${formatCompact(conflict.startsAt)} – ${formatCompact(end)}`;
  }, [conflict.startsAt, conflict.endsAt, conflict.selectedDate]);

  const isDaysType = conflict.activeType === "days";

  return (
    <TouchableOpacity
      style={[s.conflictCard, isExpanded && s.conflictCardExpanded]}
      activeOpacity={0.85}
      onPress={onToggle}
    >
      {isDaysType ? (
        <View style={s.collapsedRow}>
          <View style={s.pillRow}>
            {conflictingDayIndices.map((dayIndex) => (
              <View key={dayIndex} style={s.dayPill}>
                <Text style={s.dayPillText}>{DAYS[dayIndex].slice(0, 3)}</Text>
              </View>
            ))}
          </View>
          <View style={s.recurringBadge}>
            <Text style={s.recurringBadgeText}>
              {conflict.recurring ? "Repeats weekly" : "Not repeating"}
            </Text>
          </View>
        </View>
      ) : (
        <View style={s.collapsedRow}>
          <Text style={s.dateRangeText}>{dateLabel}</Text>
          <View style={s.recurringBadge}>
            <Text style={s.recurringBadgeText}>Date Type</Text>
          </View>
        </View>
      )}

      {isExpanded && (
        <View style={s.expandedWrap}>
          {conflict.scheduleName !== "N/A" && (
            <Text style={s.cardTitle}>{conflict.scheduleName}</Text>
          )}

          {isDaysType && (
            <View style={s.dayChipRow}>
              {DAYS.map((day, index) => {
                const belongsToSchedule = conflict.selectedDays?.includes(index) ?? false;
                const isConflicting = conflictingDayIndices.includes(index);

                return (
                  <View
                    key={day}
                    style={[
                      s.dayChip,
                      belongsToSchedule && s.dayChipActive,
                      !belongsToSchedule && s.dayChipDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        s.dayChipText,
                        belongsToSchedule && s.dayChipTextActive,
                        isConflicting && s.dayChipTextConflict,
                      ]}
                    >
                      {day.slice(0, 3)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function useCStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.60)",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        },
        modalCard: {
          width: "100%",
          maxWidth: 420,
          maxHeight: "75%",
          backgroundColor: Colors.bgModal,
          borderRadius: Radius.lg,
          borderWidth: 1,
          borderColor: Colors.border,
        },
        header: {
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          gap: 8,
        },
        headerTop: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        },
        titleRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        titleIconWrap: {
          width: 26,
          height: 26,
          borderRadius: 13,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: (Colors.danger ?? "#E5484D") + "1A",
        },
        title: {
          fontSize: 18,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: Colors.textPrimary,
        },
        infoBtn: {
          width: 30,
          height: 30,
          borderRadius: 15,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Colors.bgElevated,
          borderWidth: 1,
          borderColor: Colors.border,
        },
        subtitle: {
          fontSize: 13,
          fontFamily: "Inter",
          fontWeight: "400",
          color: Colors.textMuted,
        },
        scrollArea: { flexGrow: 0 },
        scrollContent: {
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 8,
        },
        conflictCard: {
          backgroundColor: Colors.bgCard,
          borderRadius: Radius.md,
          borderWidth: 1,
          borderColor: Colors.border,
          padding: 14,
          marginBottom: 10,
        },
        conflictCardExpanded: {},
        collapsedRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
        },
        pillRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
          flex: 1,
        },
        dayPill: {
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: Radius.sm ?? 6,
          backgroundColor: Colors.accent + "1A",
        },
        dayPillText: {
          fontSize: 12,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: Colors.accent,
        },
        recurringBadge: {
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: Radius.sm ?? 6,
          backgroundColor: Colors.bgElevated,
          borderWidth: 1,
          borderColor: Colors.border,
        },
        recurringBadgeText: {
          fontSize: 10,
          fontFamily: "Inter-Medium",
          fontWeight: "500",
          color: Colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        dateRangeText: {
          fontSize: 13,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: Colors.danger ?? "#E5484D",
        },
        expandedWrap: {
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          gap: 10,
        },
        cardTitle: {
          fontSize: 14,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: Colors.textPrimary,
        },
        dayChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
        dayChip: {
          width: 34,
          height: 34,
          borderRadius: 17,
          borderWidth: 1,
          borderColor: Colors.border,
          backgroundColor: Colors.bgElevated,
          alignItems: "center",
          justifyContent: "center",
        },
        dayChipActive: {
          borderWidth: 0,
          backgroundColor: Colors.accent + "1A",
        },
        dayChipDisabled: { opacity: 0.35 },
        dayChipText: {
          fontSize: 11,
          fontFamily: "Inter-Medium",
          fontWeight: "500",
          color: Colors.textSecondary,
        },
        dayChipTextActive: {
          color: "#111111",
          fontFamily: "Inter-Medium",
          fontWeight: "500",
        },
        dayChipTextConflict: {
          color: Colors.danger ?? "#E5484D",
          fontFamily: "Inter-Medium",
          fontWeight: "500",
        },
        actions: {
          flexDirection: "row",
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        },
        cancelBtn: {
          flex: 1,
          backgroundColor: Colors.bgElevated,
          borderRadius: Radius.lg,
          paddingVertical: 14,
          alignItems: "center",
          borderWidth: 1,
          borderColor: Colors.border,
        },
        cancelText: {
          fontSize: 15,
          fontFamily: "Inter-Medium",
          fontWeight: "500",
          color: Colors.textSecondary,
        },
        resolveBtn: {
          flex: 2,
          backgroundColor: Colors.accent,
          borderRadius: Radius.lg,
          paddingVertical: 14,
          alignItems: "center",
          justifyContent: "center",
        },
        resolveBtnDisabled: {
          backgroundColor: Colors.bgElevated,
        },
        resolveText: {
          fontSize: 15,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: Colors.white,
        },
      }),
    [colors],
  );
}
