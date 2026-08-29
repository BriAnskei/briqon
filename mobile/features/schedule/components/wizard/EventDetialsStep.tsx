import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import type { FormState } from "@/type/NewScheduleTypes";
import { Colors, Radius, Shadow } from "@/type/theme";
import { EVENT_TYPES } from "../../contants/wizardOptions";

type Props = {
  form: FormState;
  patch: (p: Partial<FormState>) => void;
};

export function EventDetailsStep({ form, patch }: Props) {
  const s = useSStyles();
  return (
    <View style={s.body}>
      <Text style={s.title}>What's the occasion?</Text>
      <Text style={s.sub}>
        Pick the event type so we can shape your schedule around it.
      </Text>

      <View style={s.grid}>
        {EVENT_TYPES.map((opt) => {
          const active = form.eventType === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                s.card,
                active && {
                  borderColor: opt.color,
                  backgroundColor: opt.color + "14",
                },
              ]}
              onPress={() => patch({ eventType: opt.key })}
              activeOpacity={0.8}
            >
              <View
                style={[
                  s.cardIcon,
                  {
                    backgroundColor: active ? opt.color + "25" : Colors.bgElevated,
                  },
                ]}
              >
                <Ionicons
                  name={opt.icon}
                  size={22}
                  color={active ? opt.color : Colors.textMuted}
                />
              </View>
              <Text style={[s.cardLabel, active && { color: opt.color }]}>
                {opt.label}
              </Text>
              {active && (
                <View style={[s.check, { backgroundColor: opt.color }]}>
                  <Ionicons name="checkmark" size={10} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {form.eventType === "other" && (
        <View style={s.otherSection}>
          <Text style={s.fieldLabel}>Describe the event</Text>
          <View style={s.inputRow}>
            <Ionicons name="pencil-outline" size={15} color={Colors.textMuted} />
            <TextInput
              style={s.inputField}
              value={form.eventOtherLabel}
              onChangeText={(t) => patch({ eventOtherLabel: t })}
              placeholder="e.g. Family reunion, Office party, Graduation..."
              placeholderTextColor={Colors.textMuted}
              returnKeyType="done"
              autoFocus
            />
          </View>
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
          color: colors.textPrimary,
          letterSpacing: -0.4,
          marginBottom: 6,
        },
        sub: {
          fontSize: 13,
          fontFamily: "Inter",
          fontWeight: "400",
          color: colors.textMuted,
          lineHeight: 20,
          marginBottom: 24,
        },
        grid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 4,
        },
        card: {
          backgroundColor: colors.bgCard,
          borderRadius: Radius.lg,
          borderWidth: 1.5,
          borderColor: colors.border,
          paddingVertical: 14,
          paddingHorizontal: 12,
          alignItems: "center",
          gap: 8,
          minWidth: 88,
          flex: 1,
          position: "relative",
          ...Shadow.card,
        },
        cardIcon: {
          width: 44,
          height: 44,
          borderRadius: Radius.md,
          alignItems: "center",
          justifyContent: "center",
        },
        cardLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textPrimary,
          textAlign: "center",
        },
        check: {
          position: "absolute",
          top: 8,
          right: 8,
          width: 18,
          height: 18,
          borderRadius: 9,
          alignItems: "center",
          justifyContent: "center",
        },
        otherSection: {
          marginTop: 20,
          backgroundColor: colors.bgCard,
          borderRadius: Radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          ...Shadow.card,
        },
        fieldLabel: {
          fontSize: 12,
          fontFamily: "Inter-Medium",
          fontWeight: "500",
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 10,
        },
        inputRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: colors.bgElevated,
          borderRadius: Radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        inputField: {
          flex: 1,
          fontSize: 14,
          fontFamily: "Inter",
          fontWeight: "400",
          color: colors.textPrimary,
          padding: 0,
        },
      }),
    [colors],
  );
}
