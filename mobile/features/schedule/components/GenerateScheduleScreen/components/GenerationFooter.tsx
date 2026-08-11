import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { Colors, Radius, Shadow } from "@/type/theme";

interface GenerationFooterProps {
  onSave: () => void;
  onSetActive: () => void;
}

export function GenerationFooter({ onSave, onSetActive }: GenerationFooterProps) {
  const s = useSStyles();
  return (
    <View style={s.footer}>
      <TouchableOpacity style={[s.footerBtn, s.saveBtn]} onPress={onSave} activeOpacity={0.85}>
        <Ionicons name="bookmark-outline" size={17} color={Colors.textPrimary} />
        <Text style={s.saveBtnText}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.footerBtn, s.setActiveBtn]}
        onPress={onSetActive}
        activeOpacity={0.85}
      >
        <Ionicons name="checkmark-circle-outline" size={17} color={Colors.bg} />
        <Text style={s.setActiveBtnText}>Set Active</Text>
      </TouchableOpacity>
    </View>
  );
}

function useSStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        footer: {
          flexDirection: "row",
          gap: 12,
          paddingHorizontal: 24,
          paddingTop: 14,
          paddingBottom: 8,
          backgroundColor: Colors.bgCard,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        },
        footerBtn: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderRadius: Radius.lg,
          paddingVertical: 12,
        },
        saveBtn: {
          backgroundColor: Colors.bgElevated,
          borderWidth: 1,
          borderColor: Colors.border,
        },
        saveBtnText: {
          fontSize: 14,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: Colors.textPrimary,
        },
        setActiveBtn: { backgroundColor: Colors.accent, ...Shadow.accent },
        setActiveBtnText: {
          fontSize: 14,
          fontFamily: "Inter-Medium",
          fontWeight: "500",
          color: Colors.white,
          letterSpacing: 0.2,
        },
      }),
    [colors],
  );
}
