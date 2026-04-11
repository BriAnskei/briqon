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
import { useScheduleScreen } from "@/hooks/useScheduleScreen";
import { ChatBubble } from "@/features/schedule-conversation/components/ChatBubble";
import { ReviewModal } from "@/features/schedule-conversation/components/ReviewModel";
import { ScheduleBlock } from "@/features/schedule-conversation/components/ScheduleBlock";
import { ScheduleSkeletonBlock } from "@/features/schedule-conversation/components/ScheduleSkeletonBlock";
import { MessageLoadingIndicator } from "@/features/schedule-conversation/components/MessageLoadingIndicator";

const MAX_INPUT_HEIGHT = 120;

export default function ScheduleConversation() {
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

  const {
    router,
    conversation,
    handleSend,
    isStreaming,
    prompt,
    setPrompt,
    modalVisible,
    setModalVisible,
    selectedScheduleId,
    setSelectedScheduleId,
    scrollRef,
    selectedItems,
    handleReview,
    handleAddNewMessage,
    handleConfirm,
  } = useScheduleScreen();

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
        <Text style={s.headerTitle}>Your Schedule</Text>
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
              // this shold be loading ui for general message
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
                setInputHeight(Math.min(newHeight - 10, MAX_INPUT_HEIGHT));
              }}
            />
            <TouchableOpacity
              style={[
                s.sendBtn,
                (!prompt.trim() || isStreaming) && s.sendBtnOff,
              ]}
              onPress={handleAddNewMessage}
              disabled={!prompt.trim() || isStreaming}
              activeOpacity={0.85}
            >
              <Text style={s.sendBtnIcon}>{isStreaming ? "■" : "↑"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ReviewModal
        visible={modalVisible}
        items={selectedItems}
        onClose={() => setModalVisible(false)}
        onConfirm={handleConfirm}
      />
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
  input: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
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
