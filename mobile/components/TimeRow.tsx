import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Shadow } from "@/type/theme";
import { TimeFormatter } from "@/utils/TimeFormatter";

type Props = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  time: Date;
  onPress: () => void;
};

export function TimeRow({ label, icon, time, onPress }: Props) {
  const s = useSStyles();
  const safeTime = time instanceof Date ? time : new Date(time as any);
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.8}>
      <View style={s.iconWrap}>
        <Ionicons name={icon} size={18} color={Colors.accent} />
      </View>
      <View style={s.body}>
        <Text style={s.label}>{label}</Text>
        <Text style={s.time}>{TimeFormatter.formatTime(safeTime)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

function useSStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 14,
    ...Shadow.card,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  label: { fontSize: 12, color: Colors.textMuted, marginBottom: 3 },
  time: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary },
}),
    [colors],
  );
};
