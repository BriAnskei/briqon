import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors, Radius, Shadow } from "@/type/theme";
import { TimeFormatter } from "@/utils/TimeFormatter";
import { TimeRow } from "@/components/TimeRow";
import { NewScheduleFormState } from "@/type/NewScheduleTypes";

type Props = {
  form: NewScheduleFormState;
  patch: (p: Partial<NewScheduleFormState>) => void;
};

export function EventTimeStep({ form, patch }: Props) {
  const s = useSStyles();
  return (
    <View style={s.body}>
      <Text style={s.title}>Time & schedule</Text>
      <Text style={s.sub}>
        Set when the event runs. You'll add key segments on the next step.
      </Text>

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
        <Text style={s.durationText}>
          {TimeFormatter.durationText(form.startTime, form.endTime)}
        </Text>
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
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
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
  durationText: { fontSize: 12, color: Colors.textMuted },
}),
    [colors],
  );
};
