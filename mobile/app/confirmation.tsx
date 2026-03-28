import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Animated,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors, Radius, Shadow } from "../type/theme";
import { ScheduleItem } from "../type/responseType";
import { useSchedule } from "../context/ScheduleContext";

const TONE: Record<string, string> = {
  wake: "#7B6FFF",
  work: "#7B6FFF",
  fitness: "#1FD8A0",
  study: "#1FD8A0",
  meal: "#A78BFA",
  rest: "#A78BFA",
  "wind-down": "#64748B",
};

export default function ConfirmationScreen() {
  const router = useRouter();
  const { scheduleItems } = useSchedule();

  // All alarms start OFF — user decides here
  const [alarms, setAlarms] = useState<ScheduleItem[]>(
    scheduleItems.map((i) => ({ ...i, alarmEnabled: false })),
  );
  const [isSet, setIsSet] = useState(false);
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.94)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const toggle = (id: string) =>
    setAlarms((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, alarmEnabled: !a.alarmEnabled } : a,
      ),
    );

  const toggleAll = () => {
    const anyOn = alarms.some((a) => a.alarmEnabled);
    setAlarms((prev) => prev.map((a) => ({ ...a, alarmEnabled: !anyOn })));
  };

  const handleSet = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }),
    ]).start(() => {
      setIsSet(true);
      Animated.parallel([
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(successScale, {
          toValue: 1,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const enabledCount = alarms.filter((a) => a.alarmEnabled).length;
  const allOn = alarms.every((a) => a.alarmEnabled);

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={isSet}>
          <Text style={[s.backIcon, isSet && { opacity: 0.25 }]}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Set Alarms</Text>
        <TouchableOpacity onPress={toggleAll} disabled={isSet}>
          <Text style={s.toggleAllText}>
            {allOn ? "Disable all" : "Enable all"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Success overlay */}
      {isSet && (
        <Animated.View
          style={[
            s.overlay,
            { opacity: successOpacity, transform: [{ scale: successScale }] },
          ]}
        >
          <View style={s.successCard}>
            <View style={s.successIconRow}>
              <View style={s.successIconDot} />
            </View>
            <Text style={s.successTitle}>All Set</Text>
            <Text style={s.successBody}>
              {enabledCount} alarm{enabledCount !== 1 ? "s" : ""} are active and
              scheduled.
            </Text>

            <View style={s.dotSummary}>
              {alarms
                .filter((a) => a.alarmEnabled)
                .map((a) => (
                  <View key={a.id} style={s.dotChip}>
                    <View
                      style={[
                        s.dotChipDot,
                        {
                          backgroundColor: TONE[a.category] ?? Colors.textMuted,
                        },
                      ]}
                    />
                    <Text style={s.dotChipTime}>{a.time}</Text>
                  </View>
                ))}
            </View>

            <TouchableOpacity
              style={s.doneBtn}
              onPress={() => router.push("/")}
              activeOpacity={0.88}
            >
              <Text style={s.doneBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Alarm list */}
      <ScrollView
        style={s.list}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.hint}>
          Toggle the alarms you want before confirming.
        </Text>

        {alarms.map((alarm) => {
          const color = TONE[alarm.category] ?? Colors.textMuted;
          return (
            <View
              key={alarm.id}
              style={[s.row, !alarm.alarmEnabled && s.rowOff]}
            >
              <View style={[s.rowDot, { backgroundColor: color }]} />
              <View style={s.rowBody}>
                <Text style={[s.rowTitle, !alarm.alarmEnabled && s.textDim]}>
                  {alarm.title}
                </Text>
                <Text style={s.rowTime}>
                  {alarm.time} – {alarm.endTime}
                </Text>
              </View>
              <Switch
                value={alarm.alarmEnabled}
                onValueChange={() => toggle(alarm.id)}
                trackColor={{
                  false: Colors.border,
                  true: Colors.accent + "60",
                }}
                thumbColor={
                  alarm.alarmEnabled ? Colors.accent : Colors.textMuted
                }
                ios_backgroundColor={Colors.border}
                disabled={isSet}
              />
            </View>
          );
        })}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Bottom CTA */}
      {!isSet && (
        <View style={s.bottomBar}>
          <View style={s.countBox}>
            <Text style={s.countNum}>{enabledCount}</Text>
            <Text style={s.countLabel}>alarms</Text>
          </View>
          <Animated.View
            style={[{ flex: 1 }, { transform: [{ scale: buttonScale }] }]}
          >
            <TouchableOpacity
              style={[s.setBtn, enabledCount === 0 && s.setBtnOff]}
              onPress={handleSet}
              disabled={enabledCount === 0}
              activeOpacity={0.88}
            >
              <Text
                style={[s.setBtnText, enabledCount === 0 && s.setBtnTextOff]}
              >
                Set Alarms
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 62,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backIcon: { fontSize: 22, color: Colors.textSecondary },
  headerTitle: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary },
  toggleAllText: { fontSize: 13, color: Colors.accent, fontWeight: "500" },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 24, paddingTop: 26 },
  hint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 22,
    lineHeight: 20,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowOff: { opacity: 0.38 },
  rowDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  rowBody: { flex: 1 },
  rowTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  textDim: { color: Colors.textMuted },
  rowTime: { fontSize: 12, color: Colors.textMuted },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 36 : 18,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  countBox: { alignItems: "center", minWidth: 40 },
  countNum: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary },
  countLabel: { fontSize: 10, color: Colors.textMuted, letterSpacing: 0.3 },
  setBtn: {
    flex: 1,
    backgroundColor: Colors.success,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    ...Shadow.success,
  },
  setBtnOff: {
    backgroundColor: Colors.bgElevated,
    shadowOpacity: 0,
    elevation: 0,
  },
  setBtnText: { fontSize: 16, fontWeight: "700", color: Colors.bg },
  setBtnTextOff: { color: Colors.textMuted },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,8,20,0.88)",
    zIndex: 99,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  successCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.success + "30",
    width: "100%",
    ...Shadow.success,
  },
  successIconRow: { marginBottom: 18 },
  successIconDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.successSoft,
    borderWidth: 2,
    borderColor: Colors.success + "50",
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  successBody: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  dotSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginBottom: 28,
  },
  dotChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dotChipDot: { width: 7, height: 7, borderRadius: 4 },
  dotChipTime: { fontSize: 12, color: Colors.textSecondary, fontWeight: "500" },
  doneBtn: {
    backgroundColor: Colors.success,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 40,
    ...Shadow.success,
  },
  doneBtnText: { fontSize: 15, fontWeight: "700", color: Colors.bg },
});
