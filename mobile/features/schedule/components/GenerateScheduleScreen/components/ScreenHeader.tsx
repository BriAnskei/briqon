import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
        <Ionicons
          name="create-outline"
          size={20}
          color={Colors.textPrimary}
        />
      </TouchableOpacity>
      <View style={s.headerTextGroup}>
        <Text style={s.headerTitle}>Generate Schedule</Text>
        <Text style={s.headerSub}>
          Let AI build your day based on your preferences
        </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTextGroup: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
}),
    [colors],
  );
};
