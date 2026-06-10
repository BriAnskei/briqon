import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Shadow } from "@/type/theme";

import { formatTime, appointmentLabel } from "../../utils/wizardHelpers";

import { FormState } from "@/type/NewScheduleTypes";
import {
  BREAK_FREQUENCY_OPTIONS,
  PRIORITY_OPTIONS,
} from "../../contants/wizardOptions";
import { SummaryRow } from "@/components/SummaryRow";

type Props = {
  form: FormState;
  patch: (p: Partial<FormState>) => void;
};

export function PriorityStep({ form, patch }: Props) {
  const breakLabel =
    BREAK_FREQUENCY_OPTIONS.find((b) => b.key === form.breakFrequency)?.label ??
    "-";
  const priorityLabel =
    PRIORITY_OPTIONS.find((p) => p.key === form.priorityFocus)?.label ?? "-";

  const appointmentsSummary =
    form.appointments.length === 0
      ? "None"
      : form.appointments
          .map(
            (a) =>
              `${appointmentLabel(a)} · ${formatTime(a.startTime)}–${formatTime(a.endTime)}`,
          )
          .join("\n");

  return (
    <View style={s.body}>
      <Text style={s.title}>What's your priority focus?</Text>
      <Text style={s.sub}>Select the primary goal this schedule supports.</Text>

      <View style={s.gap}>
        {PRIORITY_OPTIONS.map((opt) => {
          const active = form.priorityFocus === opt.key;
          return (
            <React.Fragment key={opt.key}>
              <TouchableOpacity
                style={[
                  s.card,
                  active && {
                    borderColor: opt.color,
                    backgroundColor: opt.color + "12",
                  },
                ]}
                onPress={() => patch({ priorityFocus: opt.key })}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    s.iconWrap,
                    {
                      backgroundColor: active
                        ? opt.color + "25"
                        : Colors.bgElevated,
                    },
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={22}
                    color={active ? opt.color : Colors.textMuted}
                  />
                </View>
                <View style={s.cardBody}>
                  <Text style={[s.cardLabel, active && { color: opt.color }]}>
                    {opt.label}
                  </Text>
                  <Text style={s.cardDesc}>{opt.desc}</Text>
                </View>
                {active && (
                  <View style={[s.check, { backgroundColor: opt.color }]}>
                    <Ionicons name="checkmark" size={13} color={Colors.white} />
                  </View>
                )}
              </TouchableOpacity>

              {active && opt.key === "productivity" && (
                <View style={s.productivityInput}>
                  <Text style={s.fieldLabel}>Name your productivity goal</Text>
                  <View style={s.inputRow}>
                    <Ionicons
                      name="bookmark-outline"
                      size={15}
                      color={Colors.textMuted}
                    />
                    <TextInput
                      style={s.inputField}
                      value={form.productivityName}
                      onChangeText={(t) => patch({ productivityName: t })}
                      placeholder="e.g. Study Programming, Finish Report..."
                      placeholderTextColor={Colors.textMuted}
                      returnKeyType="done"
                    />
                  </View>
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>

      {form.priorityFocus && (
        <View style={s.reviewCard}>
          <Text style={s.reviewTitle}>Schedule Summary</Text>
          <SummaryRow icon="layers-outline" label="Type" value="Personal" />
          <SummaryRow
            icon="time-outline"
            label="Time Window"
            value={`${formatTime(form.startTime)} – ${formatTime(form.endTime)}`}
          />
          {form.appointments.length > 0 && (
            <SummaryRow
              icon="calendar-outline"
              label="Appointments"
              value={appointmentsSummary}
            />
          )}
          <SummaryRow
            icon="git-branch-outline"
            label="Break Style"
            value={breakLabel}
          />
          <SummaryRow
            icon="rocket-outline"
            label="Priority Focus"
            value={
              form.priorityFocus === "productivity" &&
              form.productivityName.trim()
                ? `Productivity – ${form.productivityName.trim()}`
                : priorityLabel
            }
          />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  body: { paddingTop: 8 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 24,
  },
  gap: { gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    gap: 14,
    position: "relative",
    ...Shadow.card,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1 },
  cardLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  cardDesc: { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  productivityInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginTop: -4,
    ...Shadow.card,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  inputField: { flex: 1, fontSize: 14, color: Colors.textPrimary, padding: 0 },
  reviewCard: {
    marginTop: 24,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    ...Shadow.card,
  },
  reviewTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
});
