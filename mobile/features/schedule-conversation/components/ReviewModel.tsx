import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { Colors, Radius, Shadow } from "@/type/theme";
import { ScheduleItem } from "@/type/MessageTypes";
import { duration } from "@/utils/parseSchedule";
import { toneForIndex, alarmForIndex } from "../constants/tones";

type Props = {
  visible: boolean;
  items: ScheduleItem[];
  onClose: () => void;
  onConfirm: () => void;
};

export function ReviewModal({ visible, items, onClose, onConfirm }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.header}>
            <Text style={s.title}>Selected Schedule</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={s.list}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item, index) => {
              const color = toneForIndex(index);
              const dur = duration(item.startTime!, item.endTime!);
              const alarmEnabled = alarmForIndex(index);
              return (
                <View key={index} style={s.item}>
                  <View style={[s.accent, { backgroundColor: color }]} />
                  <View style={[s.dot, { backgroundColor: color }]} />
                  <View style={s.body}>
                    <Text style={s.itemTitle}>{item.activity}</Text>
                    <Text style={s.itemTime}>
                      {item.startTime} – {item.endTime}
                      {dur ? ` · ${dur}` : ""}
                    </Text>
                  </View>
                  <View
                    style={[
                      s.alarmDot,
                      {
                        backgroundColor: alarmEnabled
                          ? Colors.success
                          : Colors.border,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </ScrollView>

          <View style={s.actions}>
            <TouchableOpacity
              style={s.cancelBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={s.cancelText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.confirmBtn}
              onPress={onConfirm}
              activeOpacity={0.88}
            >
              <Text style={s.confirmText}>Confirm & Set Alarms</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.60)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.bgModal,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: Colors.border,
    maxHeight: "88%",
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
  },
  handle: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { fontSize: 11, color: Colors.textSecondary },
  list: { paddingHorizontal: 16, paddingTop: 12 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    marginBottom: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    paddingRight: 16,
  },
  accent: { width: 3, alignSelf: "stretch" },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  body: { flex: 1, paddingVertical: 14 },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  itemTime: { fontSize: 12, color: Colors.textMuted },
  alarmDot: { width: 7, height: 7, borderRadius: 4 },
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: { fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
  confirmBtn: {
    flex: 2,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.accent,
  },
  confirmText: { fontSize: 15, fontWeight: "600", color: Colors.white },
});
