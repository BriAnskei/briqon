import { View, Text, StyleSheet, Platform } from "react-native";
import { Colors } from "../../type/theme";

export default function SchedulesScreen() {
  return (
    <View style={s.root}>
      {/* Header matches the app's style */}
      <View style={s.header}>
        <Text style={s.brandName}>Briqon</Text>
        <Text style={s.brandTagline}>Smart Alarm Scheduling</Text>
      </View>

      {/* Placeholder body */}
      <View style={s.body}>
        <Text style={s.label}>Schedules</Text>
        <Text style={s.sub}>Your saved schedules will appear here.</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 62 : 44,
    paddingBottom: 16,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.accent,
    letterSpacing: 0.4,
  },
  brandTagline: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  body: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  label: { fontSize: 24, fontWeight: "700", color: Colors.textPrimary },
  sub: { fontSize: 13, color: Colors.textMuted },
});
