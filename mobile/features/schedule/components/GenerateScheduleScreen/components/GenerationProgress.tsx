import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";
import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/type/theme";
import { STEP_ORDER, STEP_LABELS, Step } from "../constants";

interface GenerationProgressProps {
  completedSteps: Step[];
}

export function GenerationProgress({ completedSteps }: GenerationProgressProps) {
  const s = useSStyles();
  return (
    <View style={s.progressCard}>
      {STEP_ORDER.map((key) => {
        const done = completedSteps.includes(key);
        const active =
          !done && completedSteps.length === STEP_ORDER.indexOf(key);
        return (
          <View key={key} style={s.stepRow}>
            {done ? (
              <View style={s.stepIconDone}>
                <Ionicons name="checkmark" size={13} color={Colors.bg} />
              </View>
            ) : (
              <View style={s.stepIconPending} />
            )}
            <Text style={[s.stepLabel, done && s.stepLabelDone]}>
              {STEP_LABELS[key]}
            </Text>
            {active && (
              <ActivityIndicator
                size="small"
                color={Colors.textSecondary}
                style={{ marginLeft: 6 }}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

function useSStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
  progressCard: { padding: 18, gap: 14 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepIconDone: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIconPending: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
  },
  stepLabel: { fontSize: 13, color: Colors.textMuted },
  stepLabelDone: { color: Colors.textPrimary, fontWeight: "600" },
}),
    [colors],
  );
};
