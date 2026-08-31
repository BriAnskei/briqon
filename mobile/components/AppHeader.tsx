// components/AppHeader.tsx
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { Colors, FontFamily } from "@/type/theme"; // adjust import to your actual exports

type AppHeaderProps = {
  title?: string;
  tagline?: string;
  right?: React.ReactNode;
};

export function AppHeader({
  title = "Briqon",
  tagline = "Smart Alarm Scheduling",
  right,
}: AppHeaderProps) {
  const s = useHeaderStyles();

  return (
    <View style={s.header}>
      <View>
        <Text style={s.brandName}>{title}</Text>
        <Text style={s.brandTagline}>{tagline}</Text>
      </View>
      {right && <View style={s.headerActions}>{right}</View>}
    </View>
  );
}

// Reusable icon button so screens don't redefine headerBtn styles
export function HeaderIconButton({
  icon,
  iconSize = 20,
  iconColor,
  accent = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  accent?: boolean;
  onPress: () => void;
}) {
  const s = useHeaderStyles();
  return (
    <TouchableOpacity
      style={[s.headerBtn, accent && s.headerBtnAccent]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons
        name={icon}
        size={iconSize}
        color={iconColor ?? (accent ? Colors.white : Colors.textSecondary)}
      />
    </TouchableOpacity>
  );
}

function useHeaderStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingTop: Platform.OS === "ios" ? 54 : 44,
          paddingBottom: 8,
        },
        brandName: {
          fontSize: 24,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
          color: colors.textPrimary,
          letterSpacing: -0.4,
        },
        brandTagline: {
          fontSize: 11,
          fontFamily: FontFamily.mono,
          fontWeight: "400",
          color: colors.textSecondary,
          marginTop: 2,
          letterSpacing: 0.3,
        },
        headerActions: { flexDirection: "row", gap: 10, alignItems: "center" },
        headerBtn: {
          width: 32,
          height: 32,
          borderRadius: 999,
          backgroundColor: colors.bgElevated,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        },
        headerBtnAccent: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
      }),
    [colors],
  );
}
