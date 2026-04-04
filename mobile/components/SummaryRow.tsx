import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/type/theme";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

export function SummaryRow({ icon, label, value }: Props) {
  return (
    <View style={s.row}>
      <View style={s.iconWrap}>
        <Ionicons name={icon} size={16} color={Colors.accent} />
      </View>
      <View style={s.body}>
        <Text style={s.label}>{label}</Text>
        <Text style={s.value}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  label: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  value: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
});
