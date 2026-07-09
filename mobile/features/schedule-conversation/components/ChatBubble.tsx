import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Markdown from "react-native-markdown-display";
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
      {isUser ? (
        <Text style={[s.text, s.textUser]}>{text}</Text>
      ) : (
        <View style={s.aiTextContainer}>
          <Markdown style={markdownStyles}>{text}</Markdown>
        </View>
      )}
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
  aiTextContainer: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flex: 1,
  },
});

// Markdown styles mirror your existing AI text style
const markdownStyles = {
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textPrimary,
  },
  bullet_list: {
    marginVertical: 4,
  },
  list_item: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textPrimary,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textPrimary,
    marginVertical: 2,
  },
};
