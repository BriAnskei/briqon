import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMemo } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { TimeRow } from "@/components/TimeRow";
import { useTheme } from "@/context/ThemeContext";
import type { NewScheduleFormState } from "@/type/NewScheduleTypes";
import { Colors, Radius, Shadow } from "@/type/theme";
import { durationText } from "@/utils/TimeFormatter";

type Props = {
  form: NewScheduleFormState;
  patch: (p: Partial<NewScheduleFormState>) => void;
};

export function EventTimeStep({ form, patch }: Props) {
  const s = useSStyles();
  return (
    <View style={s.body}>
      <Text style={s.title}>Time & schedule</Text>
      <Text style={s.sub}>Set when the event runs. You'll add key segments on the next step.</Text>

      {/* ── Time pickers ──────────────────────────────────────────────── */}
      <View style={s.gap16}>
        <TimeRow
          label="Start Time"
          icon="play-circle-outline"
          time={form.startTime}
          onPress={() => patch({ showStartPicker: true })}
        />
        <TimeRow
          label="End Time"
          icon="stop-circle-outline"
          time={form.endTime}
          onPress={() => patch({ showEndPicker: true })}
        />
      </View>

      {form.showStartPicker && (
        <DateTimePicker
          value={form.startTime}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, d) => {
            patch({ showStartPicker: false });
            if (d) patch({ startTime: d });
          }}
        />
      )}
      {form.showEndPicker && (
        <DateTimePicker
          value={form.endTime}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, d) => {
            patch({ showEndPicker: false });
            if (d) patch({ endTime: d });
          }}
        />
      )}

      <View style={s.durationHint}>
        <Ionicons name="hourglass-outline" size={14} color={Colors.textMuted} />
        <Text style={s.durationText}>{durationText(form.startTime, form.endTime)}</Text>
      </View>
    </View>
  );
}

function useSStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        body: { paddingTop: 8 },
        title: {
          fontSize: 24,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: Colors.textPrimary,
          letterSpacing: -0.4,
          marginBottom: 6,
        },
        sub: {
          fontSize: 13,
          fontFamily: "Inter",
          fontWeight: "400",
          color: Colors.textMuted,
          lineHeight: 20,
          marginBottom: 24,
        },
        gap16: { gap: 16 },
        durationHint: {
          flexDirection: "row",
          alignItems: "center",
          gap: 7,
          marginTop: 16,
          paddingHorizontal: 4,
        },
        durationText: { fontSize: 12, fontFamily: "Inter", fontWeight: "400", color: Colors.textMuted },
      }),
    [colors],
  );
}
