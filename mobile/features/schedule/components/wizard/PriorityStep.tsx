import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SummaryRow } from "@/components/SummaryRow";
import { useTheme } from "@/context/ThemeContext";
import type { NewScheduleFormState } from "@/type/NewScheduleTypes";
import { Colors, Radius, Shadow } from "@/type/theme";
import { formatTime } from "@/utils/TimeFormatter";
import { BREAK_FREQUENCY_OPTIONS } from "../../contants/wizardOptions";
import { appointmentLabel } from "../../utils/wizardHelpers";

type Props = {
  form: NewScheduleFormState;
  patch: (p: Partial<NewScheduleFormState>) => void;
};

export function PriorityStep({ form, patch }: Props) {
  const s = useSStyles();
  const breakLabel =
    BREAK_FREQUENCY_OPTIONS.find((b) => b.key === form.breakFrequency)?.label ?? "-";

  const appointmentsSummary =
    form.appointments.length === 0
      ? "None"
      : form.appointments
          .map(
            (a) => `${appointmentLabel(a)} · ${formatTime(a.startTime)}–${formatTime(a.endTime)}`,
          )
          .join("\n");

  // ── Hours / minutes UI state derived from total minutes ──────────────────
  const totalMins = form.priorityDurationMinutes;
  const hoursVal = totalMins != null ? Math.floor(totalMins / 60) : null;
  const minsVal = totalMins != null ? totalMins % 60 : null;

  const handleHoursChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned === "") {
      // Clear duration only if minutes are also empty
      patch({
        priorityDurationMinutes: minsVal ? minsVal : null,
      });
      return;
    }
    const h = parseInt(cleaned, 10);
    patch({ priorityDurationMinutes: h * 60 + (minsVal ?? 0) });
  };

  const handleMinutesChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned === "") {
      patch({
        priorityDurationMinutes: hoursVal ? hoursVal * 60 : null,
      });
      return;
    }
    let m = parseInt(cleaned, 10);
    if (m > 59) m = 59;
    patch({ priorityDurationMinutes: (hoursVal ?? 0) * 60 + m });
  };

  const durationLabel =
    totalMins != null
      ? `${hoursVal ? `${hoursVal}h ` : ""}${minsVal ? `${minsVal}m` : ""}`.trim() || "0m"
      : "AI will decide";

  const isValid = (form.priorityFocusText ?? "").length > 0;

  return (
    <View style={s.body}>
      <Text style={s.title}>What's your priority focus?</Text>
      <Text style={s.sub}>
        Tell us what you want to focus on during this schedule — could be work, study, a hobby,
        errands, anything.
      </Text>

      <View style={s.fieldBlock}>
        <Text style={s.fieldLabel}>What do you want to focus on?</Text>
        <View style={s.inputRow}>
          <Ionicons name="bookmark-outline" size={15} color={Colors.textMuted} />
          <TextInput
            style={s.inputField}
            value={form.priorityFocusText}
            onChangeText={(t) => patch({ priorityFocusText: t })}
            placeholder="e.g. Study Programming, Job Hunting, Workout..."
            placeholderTextColor={Colors.textMuted}
            returnKeyType="done"
          />
        </View>
      </View>

      <View style={s.fieldBlock}>
        <View style={s.durationHeaderRow}>
          <Text style={s.fieldLabel}>How many hours? (optional)</Text>
          <Text style={s.optionalHint}>Leave blank and AI will decide</Text>
        </View>
        <View style={s.durationRow}>
          <View style={s.durationInputWrap}>
            <TextInput
              style={s.durationInput}
              value={hoursVal != null ? String(hoursVal) : ""}
              onChangeText={handleHoursChange}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={s.durationUnit}>hrs</Text>
          </View>
          <View style={s.durationInputWrap}>
            <TextInput
              style={s.durationInput}
              value={minsVal != null ? String(minsVal) : ""}
              onChangeText={handleMinutesChange}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={s.durationUnit}>min</Text>
          </View>
        </View>
      </View>

      {isValid && (
        <View style={s.reviewCard}>
          <Text style={s.reviewTitle}>Schedule Summary</Text>
          <SummaryRow icon="layers-outline" label="Type" value="Personal" />
          <SummaryRow
            icon="time-outline"
            label="Time Window"
            value={`${formatTime(form.startTime)} – ${formatTime(form.endTime)}`}
          />
          {form.appointments.length > 0 && (
            <SummaryRow icon="calendar-outline" label="Appointments" value={appointmentsSummary} />
          )}
          <SummaryRow icon="git-branch-outline" label="Break Style" value={breakLabel} />
          <SummaryRow
            icon="rocket-outline"
            label="Priority Focus"
            value={form.priorityFocusText.trim()}
          />
          <SummaryRow icon="hourglass-outline" label="Focus Duration" value={durationLabel} />
        </View>
      )}
    </View>
  );
}

function useSStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        body: { paddingTop: 8 },
        title: {
          fontSize: 24,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: Colors.textPrimary,
          letterSpacing: -0.4,
          marginBottom: 6,
        },
        sub: {
          fontSize: 13,
          fontFamily: "Inter",
          fontWeight: "400",
          color: Colors.textMuted,
          lineHeight: 20,
          marginBottom: 24,
        },
        fieldBlock: {
          backgroundColor: Colors.bgCard,
          borderRadius: Radius.lg,
          borderWidth: 1,
          borderColor: Colors.border,
          padding: 14,
          marginBottom: 14,
          ...Shadow.card,
        },
        fieldLabel: {
          fontSize: 12,
          fontFamily: "Inter-Medium",
          fontWeight: "500",
          color: Colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 8,
        },
        durationHeaderRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        },
        optionalHint: {
          fontSize: 11,
          fontFamily: "Inter",
          fontWeight: "400",
          color: Colors.textMuted,
          fontStyle: "italic",
        },
        inputRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: Colors.bgElevated,
          borderRadius: Radius.md,
          borderWidth: 1,
          borderColor: Colors.border,
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        inputField: {
          flex: 1,
          fontSize: 14,
          fontFamily: "Inter",
          fontWeight: "400",
          color: Colors.textPrimary,
          padding: 0,
        },
        durationRow: { flexDirection: "row", gap: 12 },
        durationInputWrap: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: Colors.bgElevated,
          borderRadius: Radius.md,
          borderWidth: 1,
          borderColor: Colors.border,
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        durationInput: {
          flex: 1,
          fontSize: 14,
          fontFamily: "Inter",
          fontWeight: "400",
          color: Colors.textPrimary,
          padding: 0,
          textAlign: "center",
        },
        durationUnit: {
          fontSize: 12,
          fontFamily: "Inter",
          fontWeight: "400",
          color: Colors.textMuted,
        },
        reviewCard: {
          marginTop: 10,
          backgroundColor: Colors.bgCard,
          borderRadius: Radius.xl,
          borderWidth: 1,
          borderColor: Colors.border,
          padding: 18,
          ...Shadow.card,
        },
        reviewTitle: {
          fontSize: 12,
          fontFamily: "Inter-Medium",
          fontWeight: "500",
          color: Colors.textMuted,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          marginBottom: 4,
        },
      }),
    [colors],
  );
}
