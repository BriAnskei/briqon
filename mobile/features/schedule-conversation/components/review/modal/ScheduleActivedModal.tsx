import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Colors, Radius, Shadow } from "@/type/theme";
import { CreateActiveSchedule } from "@/src/models/active_schedule.model";
import { CreateSchedule } from "@/src/models/schedule.model";
import { TimeFormatter } from "@/utils/TimeFormatter";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatActiveDays(activeSchedule: CreateActiveSchedule | null): string {
  if (!activeSchedule) return "";

  if (activeSchedule.specific_date) {
    return TimeFormatter.formatDate(activeSchedule.specific_date);
  }

  if (activeSchedule.selected_days.length === 0) return "—";

  return [...activeSchedule.selected_days]
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d])
    .join(", ");
}

interface Props {
  visible: boolean;
  onClose: () => void;
  activeSchedule: CreateActiveSchedule | null;
  schedule: CreateSchedule | null;
  goHome: () => void;
}

export function ScheduleActivatedModal({
  visible,
  onClose,
  activeSchedule,
  schedule,
  goHome,
}: Props) {
  const s = useSStyles();
  const isSaved =
    schedule && !schedule.temporary && schedule.name.trim() !== "";
  const activeDays = formatActiveDays(activeSchedule);
  const repeatsWeekly = activeSchedule?.repeat_weekly ?? false;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.dialog}>
          {/* ── Success icon ── */}
          <View style={s.iconRing}>
            <Text style={s.checkmark}>✓</Text>
          </View>

          {/* ── Title ── */}
          <Text style={s.title}>Schedule activated!</Text>
          <Text style={s.subtitle}>Your schedule is now set as active.</Text>

          {/* ── Summary card ── */}
          <View style={s.summaryCard}>
            {/* Schedule name — only if saved */}
            {isSaved && (
              <>
                <View style={s.summaryRow}>
                  <Text style={s.summaryIcon}>☰</Text>
                  <View style={s.summaryContent}>
                    <Text style={s.summaryLabel}>SCHEDULE</Text>
                    <Text style={s.summaryValue}>{schedule!.name}</Text>
                  </View>
                </View>
                <View style={s.divider} />
              </>
            )}

            {/* Active days */}
            <View style={s.summaryRow}>
              <Text style={s.summaryIcon}>📅</Text>
              <View style={s.summaryContent}>
                <Text style={s.summaryLabel}>ACTIVE ON</Text>
                <Text style={s.summaryValue}>{activeDays}</Text>
              </View>
            </View>

            <View style={s.divider} />

            {/* Recurrence */}
            <View style={s.summaryRow}>
              <Text style={s.summaryIcon}>🔁</Text>
              <View style={s.summaryContent}>
                <Text style={s.summaryLabel}>RECURRENCE</Text>
                <View
                  style={[s.badge, repeatsWeekly ? s.badgeActive : s.badgeOnce]}
                >
                  <Text
                    style={[
                      s.badgeText,
                      repeatsWeekly ? s.badgeTextActive : s.badgeTextOnce,
                    ]}
                  >
                    {repeatsWeekly ? "Repeats weekly" : "One-time only"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Go Home button ── */}
          <TouchableOpacity
            style={s.homeBtn}
            onPress={() => {
              onClose();
              goHome();
            }}
            activeOpacity={0.8}
          >
            <Text style={s.homeBtnText}>Go Home</Text>
          </TouchableOpacity>
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.60)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  dialog: {
    width: "100%",
    backgroundColor: Colors.bgModal,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: Platform.OS === "ios" ? 24 : 20,
    alignItems: "center",
  },

  // Success icon
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.successSoft,
    borderWidth: 1,
    borderColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  checkmark: {
    fontSize: 28,
    color: Colors.success,
    fontWeight: "700",
  },

  // Title
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 20,
  },

  // Summary card
  summaryCard: {
    width: "100%",
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  summaryIcon: {
    fontSize: 15,
    marginTop: 1,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },

  // Recurrence badge
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    marginTop: 2,
  },
  badgeActive: {
    backgroundColor: Colors.accentSoft,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  badgeOnce: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  badgeTextActive: {
    color: Colors.accent,
  },
  badgeTextOnce: {
    color: Colors.textSecondary,
  },

  // Go Home button
  homeBtn: {
    width: "100%",
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.lg,
    backgroundColor: Colors.accent,
    ...Shadow.accent,
  },
  homeBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
  },
}),
    [colors],
  );
};
