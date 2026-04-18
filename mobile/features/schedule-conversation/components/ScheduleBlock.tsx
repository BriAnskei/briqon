import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Colors, Radius } from "@/type/theme";
import { MessageTypes } from "@/type/MessageTypes";
import { TimelineItem } from "./TimelineItem";
import { useSchedule } from "@/context/ScheduleContext";

type Props = {
  turn: Extract<MessageTypes, { type: "schedule" }>;
  isSelected: boolean;
  onSelect: () => void;
  isStreaming: boolean;
  isLatest: boolean; // only the most recent schedule block shows Edit
};

export function ScheduleBlock({
  turn,
  isSelected,
  onSelect,
  isStreaming,
  isLatest,
}: Props) {
  const router = useRouter();
  const { setEditTarget } = useSchedule();

  const handleEditPress = () => {
    setEditTarget({ scheduleId: turn.id, items: turn.items });
    router.push("/schedule/edit");
  };

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

      <View style={s.footer}>
        {/* Select button */}
        <TouchableOpacity
          style={[
            s.btn,
            isSelected && s.btnActive,
            isStreaming && s.btnDisabled,
          ]}
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

        {/* Edit button — only on the latest schedule block */}
        {isLatest && (
          <TouchableOpacity
            style={[s.editBtn, isStreaming && s.btnDisabled]}
            onPress={handleEditPress}
            activeOpacity={0.8}
            disabled={isStreaming}
          >
            <Text style={[s.editBtnText, isStreaming && s.textDisabled]}>
              ✎ Edit
            </Text>
          </TouchableOpacity>
        )}
      </View>
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

  footer: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 12,
  },

  // Select button
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
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

  // Edit button
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    backgroundColor: Colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.accent,
  },
});
