import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, Radius } from "@/type/theme";
import { MessageTypes } from "@/type/MessageTypes";
import { TimelineItem } from "./TimelineItem";

type Props = {
  turn: Extract<MessageTypes, { type: "schedule" }>;
  isSelected: boolean;
  onSelect: () => void;
  isStreaming: boolean;
};

export function ScheduleBlock({
  turn,
  isSelected,
  onSelect,
  isStreaming,
}: Props) {
  return (
    <View style={[s.block, isSelected && s.blockSelected]}>
      <View style={s.timeline}>
        {turn.items.map((item, index) => (
          <TimelineItem
            key={index}
            item={item}
            index={index}
            isLast={index === turn.items.length - 1}
          />
        ))}
      </View>
      <TouchableOpacity
        style={[s.btn, isSelected && s.btnActive, isStreaming && s.btnDisabled]}
        onPress={onSelect}
        activeOpacity={0.8}
        disabled={isStreaming}
      >
        {isSelected ? (
          <>
            <Text style={s.checkmark}>✓</Text>
            <Text style={[s.btnTextActive, isStreaming && s.textDisabled]}>
              Selected
            </Text>
          </>
        ) : (
          <Text style={[s.btnText, isStreaming && s.textDisabled]}>
            Select this schedule
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  block: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    overflow: "hidden",
  },
  blockSelected: { borderColor: Colors.accent, borderWidth: 1.5 },
  timeline: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginHorizontal: 14,
    marginBottom: 12,
    paddingVertical: 9,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
  },
  btnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary },
  btnTextActive: { fontSize: 12, fontWeight: "600", color: Colors.white },
  checkmark: { fontSize: 12, fontWeight: "700", color: Colors.white },
  textDisabled: { opacity: 0.4 },
});
