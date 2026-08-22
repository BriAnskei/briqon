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
import { formatCompact, formatTime, minutesToTime } from "@/utils/TimeFormatter";
import { ResolveInfoPopover } from "../components/ResolveInfoPopover";

interface ActivationConflictModalProp {
  isConflictModalOpen: boolean;
  conflicts: ScheduleConflict[];
  activationDayIndices: number[];
  /**
   * Time-of-day window (minutes since midnight) of the activation
   * currently being created. Used to compute, per conflict, the actual
   * overlapping time range rather than displaying the full existing
   * schedule's window.
   */
  activationWindowStartMin: number | null;
  activationWindowEndMin: number | null;
  isResolvingConflict: boolean;
  handleCancelConflicts: () => void;
  handleResolveConflicts: () => Promise<void>;
}

type MinuteRange = { start: number; end: number };

/**
 * Intersects two time-of-day windows (minutes since midnight).
 * Handles windows that cross midnight (e.g. 22:00–02:00) by treating
 * the "end" as belonging to the next day whenever end <= start.
 * Returns null when the two windows don't actually overlap.
 */
function getMinuteOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): MinuteRange | null {
  const normalize = (start: number, end: number): [number, number] =>
    end <= start ? [start, end + 1440] : [start, end];

  const [aS, aE] = normalize(aStart, aEnd);
  const [bS, bE] = normalize(bStart, bEnd);

  const start = Math.max(aS, bS);
  const end = Math.min(aE, bE);

  if (start >= end) return null;

  return { start: start % 1440, end: end % 1440 === 0 ? 1440 : end % 1440 };
}

export function ActivationConflictModal({
  isConflictModalOpen,
  conflicts,
  activationDayIndices,
  activationWindowStartMin,
  activationWindowEndMin,
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
                <Text style={s.title}>Activation Conflicts</Text>
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
                activationWindowStartMin={activationWindowStartMin}
                activationWindowEndMin={activationWindowEndMin}
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
  activationWindowStartMin,
  activationWindowEndMin,
  isExpanded,
  onToggle,
}: {
  conflict: ScheduleConflict;
  activationDayIndices: number[];
  activationWindowStartMin: number | null;
  activationWindowEndMin: number | null;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const s = useCStyles();

  const allSelectedDays = useMemo(() => {
    if (conflict.occuring) return conflict.occuring.selectedDays;
    return conflict.nonOccuring?.selectedDays ?? [];
  }, [conflict.occuring, conflict.nonOccuring]);

  const conflictingDayIndices = useMemo(
    () => allSelectedDays.filter((d) => activationDayIndices.includes(d)),
    [allSelectedDays, activationDayIndices],
  );

  // Full window of the EXISTING conflicting schedule.
  const timeLabel = useMemo(() => {
    if (conflict.occuring) {
      return `${minutesToTime(conflict.occuring.windowStartMin)} – ${minutesToTime(conflict.occuring.windowEndMin)}`;
    }
    if (conflict.nonOccuring?.ranges?.length) {
      const range = conflict.nonOccuring.ranges[0];
      return `${formatTime(range.startsAt)} – ${formatTime(range.endsAt)}`;
    }
    return "";
  }, [conflict.occuring, conflict.nonOccuring]);

  // Same window, but as minutes-since-midnight, so it can be intersected
  // with the new activation's window below.
  const conflictMinuteWindow = useMemo((): MinuteRange | null => {
    if (conflict.occuring) {
      return {
        start: conflict.occuring.windowStartMin,
        end: conflict.occuring.windowEndMin,
      };
    }
    if (conflict.nonOccuring?.ranges?.length) {
      const range = conflict.nonOccuring.ranges[0];
      const start = new Date(range.startsAt);
      const end = new Date(range.endsAt);
      return {
        start: start.getHours() * 60 + start.getMinutes(),
        end: end.getHours() * 60 + end.getMinutes(),
      };
    }
    return null;
  }, [conflict.occuring, conflict.nonOccuring]);

  // The slice of the existing schedule's window that actually overlaps
  // with the activation currently being created. Falls back to the full
  // existing window if either side's window is unavailable or if, for
  // some edge case, no overlap can be computed.
  const overlapTimeLabel = useMemo(() => {
    if (
      !conflictMinuteWindow ||
      activationWindowStartMin == null ||
      activationWindowEndMin == null
    ) {
      return timeLabel;
    }

    const overlap = getMinuteOverlap(
      conflictMinuteWindow.start,
      conflictMinuteWindow.end,
      activationWindowStartMin,
      activationWindowEndMin,
    );

    if (!overlap) return timeLabel;

    return `${minutesToTime(overlap.start)} – ${minutesToTime(overlap.end)}`;
  }, [conflictMinuteWindow, activationWindowStartMin, activationWindowEndMin, timeLabel]);

  const dateLabel = useMemo(() => {
    if (conflict.nonOccuring?.selectedDate) return conflict.nonOccuring.selectedDate;
    if (conflict.nonOccuring?.ranges?.length) {
      return formatCompact(conflict.nonOccuring.ranges[0].startsAt);
    }
    return "";
  }, [conflict.nonOccuring]);

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
          {overlapTimeLabel ? (
            <View style={[s.recurringBadge, s.conflictTimeBadge, { marginLeft: 8 }]}>
              <Text style={[s.recurringBadgeText, s.conflictTimeBadgeText]}>
                {overlapTimeLabel}
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={s.collapsedRow}>
          <Text style={s.dateRangeText}>{dateLabel}</Text>
          <View style={s.recurringBadge}>
            <Text style={s.recurringBadgeText}>Date Type</Text>
          </View>
          {overlapTimeLabel ? (
            <View style={[s.recurringBadge, s.conflictTimeBadge, { marginLeft: 8 }]}>
              <Text style={[s.recurringBadgeText, s.conflictTimeBadgeText]}>
                {overlapTimeLabel}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {isExpanded && (
        <View style={s.expandedWrap}>
          {conflict.scheduleName !== "N/A" && (
            <Text style={s.cardTitle}>{conflict.scheduleName}</Text>
          )}

          {/* Full existing-schedule window, shown only when expanded so the
             collapsed badge above (the overlap) stays the primary signal. */}
          {timeLabel ? (
            <Text style={s.fullWindowText}>Existing schedule: {timeLabel}</Text>
          ) : null}

          {isDaysType && (
            <View style={s.dayChipRow}>
              {DAYS.map((day, index) => {
                const belongsToSchedule = allSelectedDays.includes(index);
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
        // Distinguishes the overlap-time badge (the actual conflicting
        // window) from the neutral "Repeats weekly" / "Date Type" badges.
        conflictTimeBadge: {
          backgroundColor: (Colors.danger ?? "#E5484D") + "1A",
          borderColor: (Colors.danger ?? "#E5484D") + "33",
        },
        conflictTimeBadgeText: {
          color: Colors.danger ?? "#E5484D",
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
        fullWindowText: {
          fontSize: 12,
          fontFamily: "Inter",
          fontWeight: "400",
          color: Colors.textMuted,
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
