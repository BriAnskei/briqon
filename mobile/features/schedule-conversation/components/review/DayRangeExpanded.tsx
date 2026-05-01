import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Colors, Radius } from "@/type/theme";
import { DAYS } from "../../util/reviewHelpers";

interface Props {
  startDay: number;
  endDay: number;
  onStartDay: (i: number) => void;
  onEndDay: (i: number) => void;
}

export function DayRangeExpanded({
  startDay,
  endDay,
  onStartDay,
  onEndDay,
}: Props) {
  return (
    <View style={s.container}>
      <DayRow label="From" selectedIndex={startDay} onSelect={onStartDay} />
      <DayRow label="To" selectedIndex={endDay} onSelect={onEndDay} />
    </View>
  );
}

function DayRow({
  label,
  selectedIndex,
  onSelect,
}: {
  label: string;
  selectedIndex: number;
  onSelect: (i: number) => void;
}) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {DAYS.map((d, i) => (
          <TouchableOpacity
            key={d}
            style={[s.chip, selectedIndex === i && s.chipActive]}
            onPress={() => onSelect(i)}
            activeOpacity={0.8}
          >
            <Text style={[s.chipText, selectedIndex === i && s.chipTextActive]}>
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    gap: 12,
  },
  row: { gap: 8 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  scroll: { gap: 6, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { fontSize: 13, fontWeight: "500", color: Colors.textSecondary },
  chipTextActive: { color: Colors.white, fontWeight: "600" },
});
