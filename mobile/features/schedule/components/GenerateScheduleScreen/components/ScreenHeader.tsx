import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { Colors, Radius } from "@/type/theme";

interface ScreenHeaderProps {
  onBack: () => void;
  onHome: () => void;
}

export function ScreenHeader({ onBack, onHome }: ScreenHeaderProps) {
  const s = useSStyles();
  return (
    <View style={s.header}>
      <TouchableOpacity
        style={s.headerIconBtn}
        onPress={onBack}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Back to form"
      >
        <Ionicons name="create-outline" size={20} color={Colors.textPrimary} />
      </TouchableOpacity>
      <View style={s.headerTextGroup}>
        <Text style={s.headerTitle}>Generate Schedule</Text>
        <Text style={s.headerSub}>Let AI build your day based on your preferences</Text>
      </View>
      <TouchableOpacity
        style={s.headerIconBtn}
        onPress={onHome}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Go home"
      >
        <Ionicons name="home-outline" size={20} color={Colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

function useSStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 24, // px-6
          paddingVertical: 8, // py-2
          // Transparent background + no border per spec
        },
        headerIconBtn: {
          width: 32,
          height: 32,
          borderRadius: Radius.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Colors.bgElevated,
          borderWidth: 1,
          borderColor: Colors.border,
        },
        headerTextGroup: { flex: 1 },
        headerTitle: {
          fontSize: 24,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: Colors.textPrimary,
        },
        headerSub: { fontSize: 12, fontFamily: "Inter", fontWeight: "400", color: Colors.textMuted, marginTop: 4 },
      }),
    [colors],
  );
}
