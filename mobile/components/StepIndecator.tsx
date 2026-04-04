import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/type/theme";

type Props = { step: number; labels: string[] };

export function StepIndicator({ step, labels }: Props) {
  return (
    <View style={s.row}>
      {labels.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <React.Fragment key={label}>
            <View style={s.item}>
              <View style={[s.dot, done && s.dotDone, active && s.dotActive]}>
                {done ? (
                  <Ionicons name="checkmark" size={11} color={Colors.white} />
                ) : (
                  <Text style={[s.dotNum, active && s.dotNumActive]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[s.label, active && s.labelActive, done && s.labelDone]}
              >
                {label}
              </Text>
            </View>
            {i < labels.length - 1 && (
              <View style={[s.line, done && s.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  item: { alignItems: "center", gap: 5 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: { borderColor: Colors.accent, backgroundColor: Colors.accentSoft },
  dotDone: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  dotNum: { fontSize: 11, fontWeight: "700", color: Colors.textMuted },
  dotNumActive: { color: Colors.accent },
  label: { fontSize: 10, color: Colors.textMuted, fontWeight: "500" },
  labelActive: { color: Colors.accent, fontWeight: "700" },
  labelDone: { color: Colors.success },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: Colors.border,
    marginBottom: 14,
  },
  lineDone: { backgroundColor: Colors.accent },
});
