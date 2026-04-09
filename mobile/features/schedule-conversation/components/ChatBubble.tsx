import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Radius } from "@/type/theme";
import { MessageTypes } from "@/type/MessageTypes";

type Props = {
  turn:
    | Extract<MessageTypes, { role: "user" }>
    | Extract<MessageTypes, { type: "chat" }>;
};

export function ChatBubble({ turn }: Props) {
  const isUser = turn.role === "user";
  const text =
    turn.role === "user"
      ? turn.text
      : (turn as Extract<MessageTypes, { type: "chat" }>).text;

  return (
    <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAi]}>
      {!isUser && <View style={s.aiDot} />}
      <Text style={[s.text, isUser ? s.textUser : s.textAi]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  bubble: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
    maxWidth: "85%",
  },
  bubbleUser: { flexDirection: "row-reverse", alignSelf: "flex-end" },
  bubbleAi: { flexDirection: "row", alignSelf: "flex-start" },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginTop: 6,
    flexShrink: 0,
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textUser: {
    backgroundColor: Colors.accent,
    color: Colors.white,
    fontWeight: "500",
  },
  textAi: {
    backgroundColor: Colors.bgCard,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
