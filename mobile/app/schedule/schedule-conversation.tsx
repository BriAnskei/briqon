import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Keyboard,
  KeyboardEvent as RNKeyboardEvent,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Colors, Radius, Shadow } from "@/type/theme";

import { ChatBubble } from "@/features/schedule-conversation/components/ChatBubble";
import { ScheduleBlock } from "@/features/schedule-conversation/components/ScheduleBlock";
import { ScheduleSkeletonBlock } from "@/features/schedule-conversation/components/ScheduleSkeletonBlock";
import { MessageLoadingIndicator } from "@/features/schedule-conversation/components/MessageLoadingIndicator";
import { useConversationScreen } from "@/features/schedule-conversation/hooks/useConversationScreen";

const MAX_INPUT_HEIGHT = 120;

export default function ScheduleConversation() {
  const {
    router,
    conversation,
    isStreaming,
    responseLoading,
    prompt,
    setPrompt,
    selectedScheduleId,
    setSelectedScheduleId,
    questionScheduleId,
    setQuestionScheduleId,
    getQuestionScheduleNumberr,
    scrollRef,
    handleAddNewMessage,
    prevScheduleForm,
  } = useConversationScreen();

  const insets = useSafeAreaInsets();
  const [inputHeight, setInputHeight] = useState(44);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e: RNKeyboardEvent) =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // find the id of the latest schedule block in the conversation
  const latestScheduleId =
    [...conversation]
      .reverse()
      .find((t) => t.role === "ai" && t.type === "schedule")?.id ?? null;

  const handleReview = () => {
    if (!selectedScheduleId || isStreaming) return;
    router.push("/schedule/review");
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          disabled={isStreaming}
          style={isStreaming && s.disabledOpacity}
        >
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          Your {prevScheduleForm?.scheduleType ?? "sdf"} Schedule
        </Text>
        <TouchableOpacity
          style={[
            s.reviewBtn,
            (!selectedScheduleId || isStreaming) && s.reviewBtnDisabled,
            isStreaming && s.disabledOpacity,
          ]}
          onPress={handleReview}
          activeOpacity={0.85}
          disabled={!selectedScheduleId || isStreaming}
        >
          <Text style={s.reviewBtnText}>Review</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={s.list}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {conversation.map((turn) => {
            if (
              turn.role === "ai" &&
              turn.type === "loading" &&
              turn.messageType === "schedule"
            )
              return <ScheduleSkeletonBlock key={turn.id} />;
            if (
              turn.role === "ai" &&
              turn.type === "loading" &&
              turn.messageType === "message"
            )
              return <MessageLoadingIndicator key={turn.id} />;
            if (turn.role === "user")
              return <ChatBubble key={turn.id} turn={turn} />;
            if (turn.role === "ai" && turn.type === "chat")
              return <ChatBubble key={turn.id} turn={turn} />;
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
                  isStreaming={isStreaming}
                  isLatest={turn.id === latestScheduleId}
                  onAskAbout={() => setQuestionScheduleId(turn.id)}
                  isSelectedForQuestion={questionScheduleId === turn.id}
                />
              );
            }
            return null;
          })}
        </ScrollView>

        <View
          style={[
            s.bottomBar,
            {
              paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 12,
              marginBottom: keyboardHeight,
            },
          ]}
        >
          <View style={s.inputRow}>
            {/* Input box — pill + text input inside the same rounded container */}
            <View style={s.inputBox}>
              {questionScheduleId && (
                <View style={s.schedulePill}>
                  <Text style={s.schedulePillText}>
                    Schedule {getQuestionScheduleNumberr()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setQuestionScheduleId(null)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={s.schedulePillX}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TextInput
                style={[s.input, { height: Math.max(44, inputHeight) }]}
                placeholder="Ask anything or adjust your schedule…"
                placeholderTextColor={Colors.textMuted}
                value={prompt}
                onChangeText={setPrompt}
                onSubmitEditing={handleAddNewMessage}
                returnKeyType="send"
                multiline
                scrollEnabled={inputHeight >= MAX_INPUT_HEIGHT}
                textAlignVertical="top"
                onContentSizeChange={(e) => {
                  const newHeight = e.nativeEvent.contentSize.height;
                  setInputHeight(Math.min(newHeight, MAX_INPUT_HEIGHT));
                }}
              />
            </View>

            <TouchableOpacity
              style={[
                s.sendBtn,
                (!prompt.trim() || isStreaming || responseLoading) &&
                  s.sendBtnOff,
              ]}
              onPress={handleAddNewMessage}
              disabled={!prompt.trim() || isStreaming || responseLoading}
              activeOpacity={0.85}
            >
              <Text style={s.sendBtnIcon}>
                {isStreaming || responseLoading ? "■" : "↑"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  disabledOpacity: { opacity: 0.4 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
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
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 },
  bottomBar: {
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },

  // Outer rounded container that wraps pill + text input
  inputBox: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
  },

  // Schedule pill inside the input box
  schedulePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: Colors.accent + "20",
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  schedulePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.accent,
  },
  schedulePillX: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.accent,
  },

  // TextInput — no longer has its own background/border/padding since inputBox handles that
  input: {
    paddingVertical: 10,
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
});
