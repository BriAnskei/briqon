import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors, Radius, Shadow } from "../type/theme";

import { useTextInput } from "@/hooks/useInput";
import { duration } from "@/utils/parseSchedule";
import { MessageTypes, ScheduleItem } from "@/type/MessageTypes";
import { useScheduleScreen } from "@/hooks/useScheduleScreen";

// ─── Constants ────────────────────────────────────────────────────────────────

const TONE: string[] = [
  "#FFB547",
  "#7B6FFF",
  "#1FD8A0",
  "#5BB8FF",
  "#FF8C69",
  "#C084FC",
  "#64748B",
];

function toneForIndex(index: number): string {
  return TONE[index % TONE.length];
}

// Deterministic pseudo-random alarm from index
function alarmForIndex(index: number): boolean {
  return index % 3 !== 2;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

// const MOCK_SCHEDULE_A: ScheduleItem[] = [
//   {
//     startTime: "6:00 AM",
//     endTime: "6:30 AM",
//     activity: "Wake Up & Morning Routine",
//   },
//   { startTime: "6:30 AM", endTime: "7:30 AM", activity: "Morning Workout" },
//   { startTime: "7:30 AM", endTime: "8:00 AM", activity: "Breakfast" },
//   { startTime: "8:00 AM", endTime: "12:00 PM", activity: "Deep Work Block" },
//   { startTime: "12:00 PM", endTime: "12:45 PM", activity: "Lunch" },
//   { startTime: "1:00 PM", endTime: "3:00 PM", activity: "Study / Upskilling" },
//   { startTime: "3:00 PM", endTime: "3:30 PM", activity: "Rest & Recharge" },
//   { startTime: "3:30 PM", endTime: "6:00 PM", activity: "Evening Work" },
//   { startTime: "6:00 PM", endTime: "7:00 PM", activity: "Dinner" },
//   { startTime: "9:00 PM", endTime: "10:00 PM", activity: "Wind Down" },
// ];

// const MOCK_SCHEDULE_B: ScheduleItem[] = [
//   { startTime: "6:30 AM", endTime: "7:00 AM", activity: "Wake Up" },
//   { startTime: "7:00 AM", endTime: "7:45 AM", activity: "Morning Run" },
//   { startTime: "7:45 AM", endTime: "8:15 AM", activity: "Breakfast" },
//   { startTime: "8:30 AM", endTime: "12:00 PM", activity: "Work Block 1" },
//   { startTime: "12:00 PM", endTime: "1:00 PM", activity: "Lunch Break" },
//   { startTime: "1:00 PM", endTime: "2:30 PM", activity: "Study Block" },
//   { startTime: "2:30 PM", endTime: "5:30 PM", activity: "Work Block 2" },
//   { startTime: "6:00 PM", endTime: "7:00 PM", activity: "Dinner" },
//   {
//     startTime: "7:00 PM",
//     endTime: "10:00 PM",
//     activity: "Leisure & Wind Down",
//   },
// ];

// ─── Types ────────────────────────────────────────────────────────────────────

// const MOCK_CONVERSATION: MessageTypes[] = [
//   {
//     id: "t1",
//     role: "user",
//     text: "I wake up at 6am and work from 8 to 6. I want to fit in a workout, study time, and proper meals.",
//   },
//   {
//     id: "t2",
//     role: "ai",
//     type: "schedule",
//     items: MOCK_SCHEDULE_A,
//   },
//   {
//     id: "t3",
//     role: "user",
//     text: "Looks good! Can you push the wake up 30 minutes later and make the morning workout a run instead?",
//   },
//   {
//     id: "t4",
//     role: "ai",
//     type: "schedule",
//     items: MOCK_SCHEDULE_B,
//   },
//   {
//     id: "t5",
//     role: "user",
//     text: "How many hours of deep work is that per day?",
//   },
//   {
//     id: "t6",
//     role: "ai",
//     type: "chat",
//     text: "Based on the latest schedule, you have about 7 hours of focused work time split across two blocks — 8:30 AM to 12:00 PM (3.5h) and 2:30 PM to 5:30 PM (3h). That's a solid productive day with a proper midday break built in.",
//   },
// ];

// ─── TimelineItem ─────────────────────────────────────────────────────────────

function TimelineItem({
  item,
  index,
  isLast,
}: {
  item: ScheduleItem;
  index: number;
  isLast: boolean;
}) {
  const color = toneForIndex(index);
  const dur = duration(item.startTime!, item.endTime!);

  return (
    <View style={s.tlRow}>
      <View style={s.tlLeft}>
        <Text style={s.tlTime}>{item.startTime}</Text>
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
                {item.startTime} – {item.endTime} · {dur}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── ScheduleBlock ─────────────────────────────────────────────────────────────

function ScheduleBlock({
  turn,
  isSelected,
  onSelect,
}: {
  turn: Extract<MessageTypes, { type: "schedule" }>;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <View style={[s.scheduleBlock, isSelected && s.scheduleBlockSelected]}>
      {/* Timeline */}
      <View style={s.scheduleTimeline}>
        {turn.items.map((item, index) => (
          <TimelineItem
            key={index}
            item={item}
            index={index}
            isLast={index === turn.items.length - 1}
          />
        ))}
      </View>

      {/* Select button */}
      <TouchableOpacity
        style={[s.selectBtn, isSelected && s.selectBtnActive]}
        onPress={onSelect}
        activeOpacity={0.8}
      >
        {isSelected ? (
          <>
            <Text style={s.selectBtnCheckmark}>✓</Text>
            <Text style={s.selectBtnTextActive}>Selected</Text>
          </>
        ) : (
          <Text style={s.selectBtnText}>Select this schedule</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── ChatBubble ───────────────────────────────────────────────────────────────

function ChatBubble({
  turn,
}: {
  turn:
    | Extract<MessageTypes, { role: "user" }>
    | Extract<MessageTypes, { type: "chat" }>;
}) {
  const isUser = turn.role === "user";
  const text =
    turn.role === "user"
      ? turn.text
      : (turn as Extract<MessageTypes, { type: "chat" }>).text;
  return (
    <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAi]}>
      {!isUser && <View style={s.bubbleAiDot} />}
      <Text style={[s.bubbleText, isUser ? s.bubbleTextUser : s.bubbleTextAi]}>
        {text}
      </Text>
    </View>
  );
}

// ─── ReviewModal ──────────────────────────────────────────────────────────────

function ReviewModal({
  visible,
  items,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  items: ScheduleItem[];
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>Selected Schedule</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={s.sheetList}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item, index) => {
              const color = toneForIndex(index);
              const dur = duration(item.startTime!, item.endTime!);
              const alarmEnabled = alarmForIndex(index);
              return (
                <View key={index} style={s.sheetItem}>
                  <View style={[s.sheetAccent, { backgroundColor: color }]} />
                  <View style={[s.sheetDot, { backgroundColor: color }]} />
                  <View style={s.sheetBody}>
                    <Text style={s.sheetItemTitle}>{item.activity}</Text>
                    <Text style={s.sheetItemTime}>
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
          <View style={s.sheetActions}>
            <TouchableOpacity
              style={s.cancelBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={s.cancelBtnText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.confirmBtn}
              onPress={onConfirm}
              activeOpacity={0.88}
            >
              <Text style={s.confirmBtnText}>Confirm & Set Alarms</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── ScheduleScreen ───────────────────────────────────────────────────────────

export default function ScheduleScreen() {
  const router = useRouter();

  const { conversation } = useScheduleScreen();

  const { prompt, setPrompt } = useTextInput();

  const [modalVisible, setModalVisible] = useState(false);

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );

  const scrollRef = useRef<ScrollView>(null);

  // Derive the items for the currently selected schedule
  const selectedItems: ScheduleItem[] = (() => {
    if (!selectedScheduleId) return [];
    const turn = conversation.find(
      (t) =>
        t.id === selectedScheduleId &&
        t.role === "ai" &&
        (t as any).type === "schedule",
    ) as Extract<MessageTypes, { type: "schedule" }> | undefined;
    return turn?.items ?? [];
  })();

  const handleReview = () => {
    if (!selectedScheduleId) return;
    setModalVisible(true);
  };

  const handleConfirm = () => {
    setModalVisible(false);
    router.push("/confirmation");
  };

  // const handleSend = () => {
  //   if (!prompt.trim()) return;
  //   const text = prompt.trim();
  //   setPrompt("");
  //   setConversation((prev) => [
  //     ...prev,
  //     { id: `user-${Date.now()}`, role: "user", text },
  //   ]);
  //   setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  // };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Your Schedule</Text>
        <TouchableOpacity
          style={[s.reviewBtn, !selectedScheduleId && s.reviewBtnDisabled]}
          onPress={handleReview}
          activeOpacity={0.85}
          disabled={!selectedScheduleId}
        >
          <Text style={s.reviewBtnText}>Review</Text>
        </TouchableOpacity>
      </View>

      {/* Conversation scroll */}
      <ScrollView
        ref={scrollRef}
        style={s.list}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      >
        {conversation.map((turn) => {
          if (turn.role === "user") {
            return <ChatBubble key={turn.id} turn={turn} />;
          }
          if (turn.role === "ai" && turn.type === "chat") {
            return <ChatBubble key={turn.id} turn={turn} />;
          }
          if (turn.role === "ai" && turn.type === "schedule") {
            return (
              <ScheduleBlock
                key={turn.id}
                turn={turn}
                isSelected={selectedScheduleId === turn.id}
                onSelect={() =>
                  setSelectedScheduleId((prev) =>
                    prev === turn.id ? null : turn.id,
                  )
                }
              />
            );
          }
          return null;
        })}
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Input bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.bottomBar}
      >
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            placeholder="Ask anything or adjust your schedule…"
            placeholderTextColor={Colors.textMuted}
            value={prompt}
            onChangeText={setPrompt}
            // onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[s.sendBtn, !prompt.trim() && s.sendBtnOff]}
            // onPress={handleSend}
            disabled={!prompt.trim()}
            activeOpacity={0.85}
          >
            <Text style={s.sendBtnIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Review Modal */}
      <ReviewModal
        visible={modalVisible}
        items={selectedItems}
        onClose={() => setModalVisible(false)}
        onConfirm={handleConfirm}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 62,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backIcon: { fontSize: 22, color: Colors.textSecondary },
  headerTitle: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary },
  reviewBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    ...Shadow.accent,
  },
  reviewBtnDisabled: {
    backgroundColor: Colors.bgElevated,
    shadowOpacity: 0,
    elevation: 0,
  },
  reviewBtnText: { fontSize: 13, fontWeight: "600", color: Colors.white },

  // List
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20 },

  // Chat bubbles
  bubble: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
    maxWidth: "85%",
  },
  bubbleUser: {
    flexDirection: "row-reverse",
    alignSelf: "flex-end",
  },
  bubbleAi: {
    flexDirection: "row",
    alignSelf: "flex-start",
  },
  bubbleAiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginTop: 6,
    flexShrink: 0,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleTextUser: {
    backgroundColor: Colors.accent,
    color: Colors.white,
    fontWeight: "500",
  },
  bubbleTextAi: {
    backgroundColor: Colors.bgCard,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Schedule block
  scheduleBlock: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    overflow: "hidden",
  },
  scheduleBlockSelected: {
    borderColor: Colors.accent,
    borderWidth: 1.5,
  },
  scheduleTimeline: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // Select button
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 14,
    paddingVertical: 11,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
  },
  selectBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  selectBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  selectBtnTextActive: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.white,
  },
  selectBtnCheckmark: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.white,
  },

  // Timeline
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

  // Input bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === "ios" ? 34 : 14,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  input: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.accent,
  },
  sendBtnOff: {
    backgroundColor: Colors.bgElevated,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendBtnIcon: { fontSize: 17, color: Colors.white, fontWeight: "700" },

  // Modal
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
  sheetHandle: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetTitle: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { fontSize: 11, color: Colors.textSecondary },
  sheetList: { paddingHorizontal: 16, paddingTop: 12 },
  sheetItem: {
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
  sheetAccent: { width: 3, alignSelf: "stretch" },
  sheetDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  sheetBody: { flex: 1, paddingVertical: 14 },
  sheetItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  sheetItemTime: { fontSize: 12, color: Colors.textMuted },
  alarmDot: { width: 7, height: 7, borderRadius: 4 },
  sheetActions: {
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
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.accent,
  },
  confirmBtnText: { fontSize: 15, fontWeight: "600", color: Colors.white },
});
