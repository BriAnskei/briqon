import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Radius } from "@/type/theme";
import { ScheduleItem } from "@/type/MessageTypes";
import { duration, formatTime } from "@/utils/parseSchedule";
import { toneForIndex } from "../constants/tones";

type Props = {
  item: ScheduleItem;
  index: number;
  isLast: boolean;
};

export function TimelineItem({ item, index, isLast }: Props) {
  const color = toneForIndex(index);
  const dur = duration(item.start_time!, item.end_time!);

  return (
    <View style={s.tlRow}>
      <View style={s.tlLeft}>
        <Text style={s.tlTime}>{formatTime(item.start_time)}</Text>
        {!isLast && <View style={s.tlLine} />}
      </View>
      <View style={[s.tlDot, { backgroundColor: color }]} />
      <View style={s.tlCard}>
        <View style={s.tlCardRow}>
          <View style={[s.categoryDot, { backgroundColor: color }]} />
          <View style={s.tlBody}>
            <Text style={s.tlTitle}>{item.activity}</Text>
            {dur ? (
              <Text style={s.tlMeta}>
                {formatTime(item.start_time)} – {formatTime(item.end_time)} ·{" "}
                {dur}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  tlRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 2 },
  tlLeft: {
    width: 64,
    alignItems: "flex-end",
    paddingRight: 14,
    paddingTop: 10,
  },
  tlTime: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  tlLine: {
    width: 1,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: 8,
    minHeight: 28,
  },
  tlDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 12,
    marginRight: 14,
  },
  tlCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tlCardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  categoryDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  tlBody: { flex: 1 },
  tlTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  tlMeta: { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
});
