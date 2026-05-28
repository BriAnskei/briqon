import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, Radius } from "@/type/theme";
import { DAYS } from "../../util/reviewHelpers";

interface Props {
  selectedDays: number[];
  onToggleDay: (i: number) => void;
}

export function DayRangeExpanded({ selectedDays, onToggleDay }: Props) {
  return (
    <View style={s.container}>
      <Text style={s.hint}>Tap to select days</Text>
      <View style={s.grid}>
        {DAYS.map((d, i) => {
          const active = selectedDays.includes(i);
          return (
            <TouchableOpacity
              key={d}
              style={[s.chip, active && s.chipActive]}
              onPress={() => onToggleDay(i)}
              activeOpacity={0.8}
            >
              <Text style={[s.chipText, active && s.chipTextActive]}>{d}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
  },
  hint: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
    fontWeight: "600",
  },
});
