import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors, Radius } from "@/type/theme";
import { DAYS } from "../../util/reviewHelpers";

interface Props {
  selectedDays: number[];
  onToggleDay: (i: number) => void;
  disabledDays: number[];
  startsAt: Date;
  showStartsPicker: boolean;
  onOpenStartsPicker: () => void;
  onStartsAtChange: (date: Date) => void;
  onStartsAtPickerDismiss: () => void;
}

export function DayRangeExpanded({
  selectedDays,
  onToggleDay,
  disabledDays,
  startsAt,
  showStartsPicker,
  onOpenStartsPicker,
  onStartsAtChange,
  onStartsAtPickerDismiss,
}: Props) {
  const formattedDate = startsAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <View style={s.container}>
      {/* starts_at picker row */}
      <View style={s.startsRow}>
        <View style={s.startsLeft}>
          <Text style={s.startsLabel}>Starting from</Text>
          <Text style={s.startsHint}>Disables past days in selection</Text>
        </View>
        <TouchableOpacity
          style={s.dateBtn}
          onPress={onOpenStartsPicker}
          activeOpacity={0.8}
        >
          <Text style={s.dateBtnText}>📅 {formattedDate}</Text>
        </TouchableOpacity>
      </View>

      {showStartsPicker && (
        <View style={s.pickerWrap}>
          <DateTimePicker
            value={startsAt}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            minimumDate={new Date()}
            onChange={(_, date) => {
              if (Platform.OS === "android") onStartsAtPickerDismiss();
              if (date) onStartsAtChange(date);
            }}
          />
        </View>
      )}

      {/* Day chips */}
      <Text style={s.hint}>Tap to select days</Text>
      <View style={s.grid}>
        {DAYS.map((d, i) => {
          const active = selectedDays.includes(i);
          const disabled = disabledDays.includes(i);
          return (
            <TouchableOpacity
              key={d}
              style={[
                s.chip,
                active && s.chipActive,
                disabled && s.chipDisabled,
              ]}
              onPress={() => !disabled && onToggleDay(i)}
              activeOpacity={disabled ? 1 : 0.8}
              disabled={disabled}
            >
              <Text
                style={[
                  s.chipText,
                  active && s.chipTextActive,
                  disabled && s.chipTextDisabled,
                ]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  startsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  startsLeft: { flex: 1 },
  startsLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  startsHint: { fontSize: 11, color: Colors.textMuted },
  dateBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  dateBtnText: { fontSize: 12, fontWeight: "600", color: Colors.accent },
  pickerWrap: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  hint: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipDisabled: {
    opacity: 0.35,
  },
  chipText: { fontSize: 13, fontWeight: "500", color: Colors.textSecondary },
  chipTextActive: { color: Colors.white, fontWeight: "600" },
  chipTextDisabled: { color: Colors.textMuted },
});
