import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/type/theme";
import { ScheduleItem } from "@/type/MessageTypes";
import { ACCENT_COLORS } from "../../util/reviewHelpers";

interface Props {
  item: ScheduleItem;
  index: number;
}

export function ScheduleListItem({ item, index }: Props) {
  const color = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <View style={s.row}>
      <View style={[s.accent, { backgroundColor: color }]} />
      <View style={[s.dot, { backgroundColor: color }]} />
      <View style={s.body}>
        <Text style={s.title}>{item.activity ?? "Untitled"}</Text>
        <Text style={s.time}>
          {item.start_time ?? "?"} – {item.end_time ?? "?"}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingRight: 16,
  },
  accent: { width: 3, alignSelf: "stretch" },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
    marginHorizontal: 12,
  },
  body: { flex: 1, paddingVertical: 13 },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  time: { fontSize: 12, color: Colors.textMuted },
});
