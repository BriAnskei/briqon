import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Colors, Radius } from "@/type/theme";

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function OptionPill({ label, selected, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[s.pill, selected && s.active]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[s.text, selected && s.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  active: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
  },
  text: { fontSize: 13, fontWeight: "500", color: Colors.textSecondary },
  textActive: { color: Colors.accent, fontWeight: "600" },
});
