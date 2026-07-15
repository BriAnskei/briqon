import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Radius, Shadow } from "@/type/theme";
import { ScheduleItem } from "@/src/models/schedule.model";

interface ScheduleTimelineProps {
  schedule: ScheduleItem[];
}

export function ScheduleTimeline({ schedule }: ScheduleTimelineProps) {
  return (
    <>
      <Text style={s.timelineTitle}>Your Schedule</Text>
      <View style={s.scheduleList}>
        {schedule.map((item, idx) => (
          <View key={idx} style={s.scheduleRow}>
            <View style={s.scheduleAccent} />
            <Text style={s.scheduleIndex}>{String(idx + 1).padStart(2, "0")}</Text>
            <View style={s.scheduleBody}>
              <Text
                style={s.scheduleActivity}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.activity}
              </Text>
              <Text style={s.scheduleTime} numberOfLines={1}>
                {item.start_time} – {item.end_time}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

const s = StyleSheet.create({
  timelineTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },

  scheduleList: { gap: 12 },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    paddingRight: 14,
    gap: 12,
    ...Shadow.card,
  },
  scheduleAccent: {
    width: 3,
    alignSelf: "stretch",
    backgroundColor: Colors.accent,
  },
  scheduleIndex: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.5,
    minWidth: 20,
  },
  scheduleBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 18,
  },
  scheduleActivity: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  scheduleTime: { fontSize: 12, color: Colors.textMuted, flexShrink: 0 },
});
