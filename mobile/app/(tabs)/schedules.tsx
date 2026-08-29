import { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";

export default function SchedulesScreen() {
  const s = useSStyles();
  return (
    <View style={s.root}>
      {/* Header matches the app's style */}
      <View style={s.header}>
        <Text style={s.brandName}>Briqon</Text>
        <Text style={s.brandTagline}>Smart Alarm Scheduling</Text>
      </View>

      {/* Placeholder body */}
      <View style={s.body}>
        <Text style={s.label}>Schedules</Text>
        <Text style={s.sub}>Your saved schedules will appear here.</Text>
      </View>
    </View>
  );
}

function useSStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.bg },
        header: {
          paddingHorizontal: 24, // px-6
          paddingTop: Platform.OS === "ios" ? 62 : 44,
          paddingBottom: 8, // py-2
          // Transparent background + no border per spec
        },
        brandName: {
          fontSize: 24,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: colors.textPrimary,
          letterSpacing: -0.4,
        },
        brandTagline: {
          fontSize: 11,
          fontFamily: "DMMono",
          fontWeight: "400",
          color: colors.textMuted,
          marginTop: 2,
          letterSpacing: 0.3,
        },
        body: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        },
        label: {
          fontSize: 24,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: colors.textPrimary,
        },
        sub: {
          fontSize: 13,
          fontFamily: "Inter",
          fontWeight: "400",
          color: colors.textMuted,
        },
      }),
    [colors],
  );
}
