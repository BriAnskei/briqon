import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { Colors, Radius } from "@/type/theme";

interface RegenerateCardProps {
  onRegenerate: () => void;
  isGenerating: boolean;
}

export function RegenerateCard({ onRegenerate, isGenerating }: RegenerateCardProps) {
  const s = useSStyles();
  return (
    <View style={s.regenerateCard}>
      <Ionicons
        name="sparkles-outline"
        size={18}
        color={Colors.accent}
        style={{ marginTop: 1 }}
      />
      <View style={s.regenerateTextGroup}>
        <Text style={s.regenerateQuote}>
          Not quite right? Feel free to regenerate, or tweak your preferences and try
          again — it only takes a moment.
        </Text>
        <TouchableOpacity
          style={s.regenerateBtn}
          onPress={onRegenerate}
          activeOpacity={0.85}
          disabled={isGenerating}
        >
          <Ionicons name="refresh-outline" size={14} color={Colors.accent} />
          <Text style={s.regenerateBtnText}>Regenerate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function useSStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        regenerateCard: {
          flexDirection: "row",
          gap: 10,
          borderWidth: 1,
          borderColor: Colors.border,
          backgroundColor: Colors.bgElevated,
          borderRadius: Radius.lg,
          padding: 14,
        },
        regenerateTextGroup: { flex: 1, gap: 10 },
        regenerateQuote: {
          fontSize: 13,
          fontFamily: "Inter",
          fontWeight: "400",
          lineHeight: 18,
          color: Colors.textSecondary,
          fontStyle: "italic",
        },
        regenerateBtn: {
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
          gap: 6,
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: Radius.md,
          borderWidth: 1,
          borderColor: Colors.accent,
        },
        regenerateBtnText: {
          fontSize: 12,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: Colors.accent,
        },
      }),
    [colors],
  );
}
