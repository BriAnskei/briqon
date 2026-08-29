import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import type { NewScheduleFormState } from "@/type/NewScheduleTypes";
import { Colors, Radius, Shadow } from "@/type/theme";

type Props = {
  scheduleType: NewScheduleFormState["scheduleType"];
  onChange: (v: "personal" | "event") => void;
};

const OPTIONS = [
  {
    key: "personal" as const,
    label: "Personal",
    icon: "person-outline" as const,
    desc: "Daily routine, habits & self-care",
    color: "#7B6FFF",
  },
  {
    key: "event" as const,
    label: "Event",
    icon: "calendar-outline" as const,
    desc: "One-time occasion or planned event",
    color: "#5BB8FF",
  },
];

export function TypeStep({ scheduleType, onChange }: Props) {
  const s = useSStyles();
  return (
    <View style={s.body}>
      <Text style={s.title}>What kind of schedule?</Text>
      <Text style={s.sub}>Choose the type that best describes your schedule.</Text>
      <View style={s.grid}>
        {OPTIONS.map((opt) => {
          const active = scheduleType === opt.key;
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
              onPress={() => onChange(opt.key)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  s.iconWrap,
                  {
                    backgroundColor: active ? opt.color + "25" : Colors.bgElevated,
                  },
                ]}
              >
                <Ionicons
                  name={opt.icon}
                  size={28}
                  color={active ? opt.color : Colors.textMuted}
                />
              </View>
              <Text style={[s.label, active && { color: opt.color }]}>{opt.label}</Text>
              <Text style={s.desc}>{opt.desc}</Text>
              {active && (
                <View style={[s.check, { backgroundColor: opt.color }]}>
                  <Ionicons name="checkmark" size={12} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
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
        label: {
          fontSize: 12,
          fontFamily: "Inter-Medium",
          fontWeight: "500",
          color: colors.textPrimary,
        },
        desc: {
          fontSize: 12,
          fontFamily: "Inter",
          fontWeight: "400",
          color: colors.textMuted,
          textAlign: "center",
          lineHeight: 18,
        },
        grid: { gap: 14 },
        card: {
          backgroundColor: colors.bgCard,
          borderRadius: Radius.xl,
          borderWidth: 1.5,
          borderColor: colors.border,
          padding: 20,
          alignItems: "center",
          position: "relative",
          ...Shadow.card,
        },
        iconWrap: {
          width: 60,
          height: 60,
          borderRadius: 30,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        },
        label: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: 5,
        },
        desc: {
          fontSize: 12,
          color: colors.textMuted,
          textAlign: "center",
          lineHeight: 18,
        },
        check: {
          position: "absolute",
          top: 12,
          right: 12,
          width: 22,
          height: 22,
          borderRadius: 11,
          alignItems: "center",
          justifyContent: "center",
        },
      }),
    [colors],
  );
}
