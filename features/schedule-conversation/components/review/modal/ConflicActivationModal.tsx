import React from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Colors, Radius, Shadow } from "@/type/theme";
import { ConflicActivationError } from "@/src/errors/scheduleActivationConflic.error";
import { ActiveSchedule } from "@/src/models/active_schedule.model";

// ── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS: Record<number, string> = {
  0: "Monday",
  1: "Tuesday",
  2: "Wednesday",
  3: "Thursday",
  4: "Friday",
  5: "Saturday",
  6: "Sunday",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isDaysData(data: Date | number[]): data is number[] {
  return Array.isArray(data);
}

/**
 * Determines whether the user can proceed past the conflict.
 *
 * Rules:
 * - New recurring  → can proceed only if ALL conflicts are non-recurring
 * - New non-recurring → can proceed only if ALL conflicts are recurring
 */
function canUserProceed(
  isNewRecurring: boolean,
  conflicts: ConflicActivationError["context"]["conflicts"],
): boolean {
  if (isNewRecurring) {
    return conflicts.every((c) => !c.activeSchedule.recurring);
  }
  return conflicts.every((c) => c.activeSchedule.recurring);
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface DayRowProps {
  /** All days belonging to the conflicting existing schedule (Mon-based 0–6) */
  scheduleDays: number[];
  /** Days that actually clash with the new schedule */
  conflictingDays: number[];
}

function DayRow({ scheduleDays, conflictingDays }: DayRowProps) {
  const conflictSet = new Set(conflictingDays);

  return (
    <View style={s.dayRow}>
      {scheduleDays
        .slice()
        .sort((a, b) => a - b)
        .map((day) => {
          const isConflict = conflictSet.has(day);
          return (
            <View
              key={day}
              style={[
                s.dayPill,
                isConflict ? s.dayPillConflict : s.dayPillNormal,
              ]}
            >
              <Text
                style={[
                  s.dayPillText,
                  isConflict ? s.dayPillTextConflict : s.dayPillTextNormal,
                ]}
              >
                {DAY_LABELS[day]}
              </Text>
            </View>
          );
        })}
    </View>
  );
}

interface ConflictCardProps {
  scheduleName: string;
  activeSchedule: ActiveSchedule;
  /** number[] = conflicting days of the existing schedule; Date = conflicting date */
  data: Date | number[];
  /** Days selected for the new schedule being created (used for day highlighting) */
  newScheduleDays: number[];
}

function ConflictCard({
  scheduleName,
  activeSchedule,
  data,
  newScheduleDays,
}: ConflictCardProps) {
  const isRecurring = activeSchedule.recurring;
  const isDays = isDaysData(data);

  return (
    <View style={s.conflictCard}>
      {/* Card header */}
      <View style={s.conflictCardHeader}>
        <View style={s.conflictCardTitleRow}>
          <Text style={s.conflictScheduleName} numberOfLines={1}>
            {scheduleName}
          </Text>
          <View
            style={[s.badge, isRecurring ? s.badgeRecurring : s.badgeOneTime]}
          >
            <Text
              style={[
                s.badgeText,
                isRecurring ? s.badgeTextRecurring : s.badgeTextOneTime,
              ]}
            >
              {isRecurring ? "Repeats weekly" : "One-time"}
            </Text>
          </View>
        </View>

        <View style={s.conflictTypeRow}>
          <View style={s.conflictTypeDot} />
          <Text style={s.conflictTypeLabel}>
            {isDays ? "Day-based schedule" : "Date-based schedule"}
          </Text>
        </View>
      </View>

      {/* Conflict detail */}
      <View style={s.conflictDetail}>
        {isDays ? (
          <>
            <Text style={s.conflictDetailLabel}>Conflicting days</Text>
            <DayRow
              scheduleDays={data as number[]}
              conflictingDays={(data as number[]).filter((d) =>
                newScheduleDays.includes(d),
              )}
            />
          </>
        ) : (
          <>
            <Text style={s.conflictDetailLabel}>Conflicting date</Text>
            <View style={s.datePill}>
              <Text style={s.datePillText}>📅 {formatDate(data as Date)}</Text>
            </View>
          </>
        )}

        {/* starts_at / ends_at for non-recurring */}
        {!isRecurring &&
          (activeSchedule.starts_at || activeSchedule.ends_at) && (
            <Text style={s.dateRange}>
              {activeSchedule.starts_at
                ? formatDate(activeSchedule.starts_at)
                : "—"}{" "}
              →{" "}
              {activeSchedule.ends_at
                ? formatDate(activeSchedule.ends_at)
                : "—"}
            </Text>
          )}
      </View>
    </View>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface ConflictActivationModalProps {
  visible: boolean;
  /** The caught ConflicActivationError */
  error: ConflicActivationError | null;
  /** Whether the new schedule being created is recurring */
  isNewRecurring: boolean;
  /**
   * Days selected for the new schedule (Monday-based 0–6).
   * Pass [] for date-type new schedules.
   */
  newScheduleDays: number[];
  onClose: () => void;
  /** Called when conflict is acknowledged and creation can proceed */
  onProceed: () => void;
}

export function ConflictActivationModal({
  visible,
  error,
  isNewRecurring,
  newScheduleDays,
  onClose,
  onProceed,
}: ConflictActivationModalProps) {
  if (!error) return null;

  const conflicts = error.context.conflicts;
  const proceedAllowed = canUserProceed(isNewRecurring, conflicts);

  // For a recurring new schedule that conflicts with at least one recurring
  // existing schedule → only "I understand" (dismiss) is available.
  const dismissOnly = isNewRecurring && !proceedAllowed;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.dialog}>
          {/* ── Header ── */}
          <View style={s.dialogHeader}>
            <View style={s.warningIconWrap}>
              <Text style={s.warningIcon}>⚠️</Text>
            </View>
            <View style={s.dialogHeaderText}>
              <Text style={s.dialogTitle}>Schedule Conflict</Text>
              <Text style={s.dialogSubtitle}>
                {conflicts.length} existing schedule
                {conflicts.length !== 1 ? "s" : ""} overlap
                {conflicts.length === 1 ? "s" : ""} with your selection
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={s.closeBtn}
              activeOpacity={0.8}
            >
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── Description ── */}
          <View style={s.descriptionWrap}>
            <Text style={s.descriptionText}>
              {proceedAllowed
                ? dismissOnly
                  ? // shouldn't reach here but guard anyway
                    "This conflict cannot be bypassed."
                  : "All conflicting schedules are " +
                    (isNewRecurring ? "one-time" : "recurring") +
                    " schedules. You can still proceed with the creation."
                : isNewRecurring
                  ? "One or more conflicting schedules also repeat weekly. The new recurring schedule cannot be activated while they overlap."
                  : "One or more conflicting schedules are one-time schedules on the same date or days. The new schedule cannot be activated."}
            </Text>
          </View>

          {/* ── Conflict list ── */}
          <ScrollView
            style={s.conflictList}
            contentContainerStyle={s.conflictListContent}
            showsVerticalScrollIndicator={false}
          >
            {conflicts.map((conflict, index) => (
              <ConflictCard
                key={conflict.activeSchedule.id ?? index}
                scheduleName={conflict.scheduleName}
                activeSchedule={conflict.activeSchedule}
                data={conflict.data}
                newScheduleDays={newScheduleDays}
              />
            ))}
          </ScrollView>

          {/* ── Actions ── */}
          <View style={s.actions}>
            {dismissOnly ? (
              // Recurring vs recurring — only dismiss
              <TouchableOpacity
                style={s.understandBtn}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Text style={s.understandBtnText}>I Understand, Go Back</Text>
              </TouchableOpacity>
            ) : proceedAllowed ? (
              // Can proceed
              <>
                <TouchableOpacity
                  style={s.cancelBtn}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.proceedBtn}
                  onPress={onProceed}
                  activeOpacity={0.85}
                >
                  <Text style={s.proceedBtnText}>Proceed Anyway</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Non-recurring new vs non-recurring existing — blocked
              <TouchableOpacity
                style={s.understandBtn}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Text style={s.understandBtnText}>I Understand, Go Back</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.70)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  dialog: {
    backgroundColor: Colors.bgModal,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    width: "100%",
    maxHeight: "80%",
    overflow: "hidden",
  },

  // Header
  dialogHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  warningIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255, 82, 115, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  warningIcon: { fontSize: 18 },
  dialogHeaderText: { flex: 1 },
  dialogTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  dialogSubtitle: { fontSize: 12, color: Colors.textMuted },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  closeBtnText: { fontSize: 11, color: Colors.textSecondary },

  // Description
  descriptionWrap: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  descriptionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  // Conflict list
  conflictList: { flexGrow: 0, maxHeight: 340 },
  conflictListContent: { padding: 14, gap: 10 },

  // Conflict card
  conflictCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  conflictCardHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 6,
  },
  conflictCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  conflictScheduleName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  badgeRecurring: { backgroundColor: "rgba(123,111,255,0.15)" },
  badgeOneTime: { backgroundColor: "rgba(31,216,160,0.12)" },
  badgeText: { fontSize: 10, fontWeight: "700" },
  badgeTextRecurring: { color: Colors.accent },
  badgeTextOneTime: { color: Colors.success },
  conflictTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  conflictTypeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
  },
  conflictTypeLabel: { fontSize: 11, color: Colors.textMuted },

  // Conflict detail
  conflictDetail: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  conflictDetailLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },

  // Day pills
  dayRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  dayPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  dayPillNormal: {
    backgroundColor: Colors.bgElevated,
    borderColor: Colors.border,
  },
  dayPillConflict: {
    backgroundColor: "rgba(255,82,115,0.15)",
    borderColor: Colors.danger,
  },
  dayPillText: { fontSize: 12, fontWeight: "600" },
  dayPillTextNormal: { color: Colors.textSecondary },
  dayPillTextConflict: { color: Colors.danger },

  // Date pill
  datePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.md,
    backgroundColor: "rgba(255,82,115,0.12)",
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  datePillText: { fontSize: 13, fontWeight: "600", color: Colors.danger },

  // Date range text
  dateRange: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Actions
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
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  proceedBtn: {
    flex: 2,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.accent,
  },
  proceedBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
  },
  understandBtn: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  understandBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
});
