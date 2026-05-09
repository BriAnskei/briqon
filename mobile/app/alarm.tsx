import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Colors, Radius, Shadow } from "../type/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type AlarmParams = {
  // Current alarm
  activity?: string;
  start_time?: string;
  end_time?: string;
  // Schedule meta
  schedule_name?: string;
  // Up next
  next_activity?: string;
  next_start_time?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFormattedTime() {
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return {
    time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    ampm,
  };
}

// ─── PulsingRing ──────────────────────────────────────────────────────────────

function PulsingRing({ size, delay }: { size: number; delay: number }) {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1.04,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale: anim }],
        },
      ]}
    />
  );
}

// ─── AlarmScreen ─────────────────────────────────────────────────────────────

export default function AlarmScreen() {
  const params = useLocalSearchParams<AlarmParams>();

  const {
    activity,
    start_time,
    end_time,
    schedule_name,
    next_activity,
    next_start_time,
  } = params;

  const [clock, setClock] = useState(getFormattedTime);
  const [dismissed, setDismissed] = useState(false);
  const [snoozed, setSnoozed] = useState(false);
  const [snoozeSeconds, setSnoozeSeconds] = useState(300);

  const snoozeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dismissAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(1)).current;

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setClock(getFormattedTime()), 1000);
    return () => clearInterval(id);
  }, []);

  // Blinking dot
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, {
          toValue: 0.15,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const handleDismiss = () => {
    if (snoozeRef.current) clearInterval(snoozeRef.current);
    setDismissed(true);
    Animated.timing(dismissAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const handleSnooze = () => {
    setSnoozed(true);
    setSnoozeSeconds(300);
    snoozeRef.current = setInterval(() => {
      setSnoozeSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(snoozeRef.current!);
          setSnoozed(false);
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const snoozeDisplay = `${Math.floor(snoozeSeconds / 60)}:${String(
    snoozeSeconds % 60,
  ).padStart(2, "0")}`;

  return (
    <View style={s.root}>
      {/* Pulsing rings */}
      <View style={s.ringsWrap} pointerEvents="none">
        <PulsingRing size={280} delay={0} />
        <PulsingRing size={420} delay={600} />
        <PulsingRing size={560} delay={1200} />
      </View>

      {/* Dismissed overlay */}
      {dismissed && (
        <Animated.View style={[s.dismissedOverlay, { opacity: dismissAnim }]}>
          <View style={s.dismissedIconWrap}>
            <View style={s.checkShort} />
            <View style={s.checkLong} />
          </View>
          <Text style={s.dismissedTitle}>Alarm dismissed</Text>
          <Text style={s.dismissedSub}>Have a great session</Text>
        </Animated.View>
      )}

      {/* Top bar */}
      <View style={s.topBar}>
        <Text style={s.alarmLabel}>ALARM FIRING</Text>
        {schedule_name ? (
          <Text style={s.scheduleName}>{schedule_name}</Text>
        ) : null}
      </View>

      {/* Clock */}
      <View style={s.clockSection}>
        <Text style={s.clockTime}>{clock.time}</Text>
        <Text style={s.clockAmpm}>{clock.ampm}</Text>
      </View>

      {/* Cards */}
      <View style={s.cardsStack}>
        {/* Current activity */}
        <View style={s.activityCard}>
          <Text style={s.cardLabel}>NOW</Text>
          <View style={s.activityHeader}>
            <Animated.View style={[s.activityDot, { opacity: dotAnim }]} />
            <Text style={s.activityName}>{activity ?? "Activity"}</Text>
          </View>
          <View style={s.timeRangeRow}>
            <View style={s.timeChip}>
              <Text style={s.timeChipText}>{start_time ?? "--"}</Text>
            </View>
            <Text style={s.timeArrow}>→</Text>
            <View style={s.timeChip}>
              <Text style={s.timeChipText}>{end_time ?? "--"}</Text>
            </View>
          </View>
        </View>

        {/* Up next — only renders if next data is provided */}
        {next_activity ? (
          <View style={s.upNextCard}>
            <View style={s.upNextLeft}>
              <Text style={s.upNextActivity}>{next_activity}</Text>
              {next_start_time ? (
                <View style={s.upNextTimeChip}>
                  <Text style={s.upNextTimeText}>{next_start_time}</Text>
                </View>
              ) : null}
            </View>
            <Text style={s.upNextBadge}>UP NEXT</Text>
          </View>
        ) : null}
      </View>

      {/* Actions */}
      {snoozed ? (
        <View style={s.snoozedCard}>
          <Text style={s.snoozedLabel}>SNOOZED</Text>
          <Text style={s.snoozedCountdown}>{snoozeDisplay}</Text>
        </View>
      ) : (
        <View style={s.actions}>
          <TouchableOpacity
            style={s.btnDismiss}
            onPress={handleDismiss}
            activeOpacity={0.85}
          >
            <Text style={s.btnDismissText}>Dismiss</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.btnSnooze}
            onPress={handleSnooze}
            activeOpacity={0.75}
          >
            <Text style={s.btnSnoozeText}>Snooze · 5 min</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 64 : 48,
    paddingBottom: 48,
  },
  ringsWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(123,111,255,0.08)",
  },
  dismissedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    gap: 14,
  },
  dismissedIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.successSoft,
    borderWidth: 1,
    borderColor: Colors.success + "50",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  checkShort: {
    position: "absolute",
    width: 10,
    height: 2.5,
    backgroundColor: Colors.success,
    borderRadius: 2,
    transform: [{ rotate: "45deg" }, { translateX: -4 }, { translateY: 3 }],
  },
  checkLong: {
    position: "absolute",
    width: 18,
    height: 2.5,
    backgroundColor: Colors.success,
    borderRadius: 2,
    transform: [{ rotate: "-50deg" }, { translateX: 4 }, { translateY: -1 }],
  },
  dismissedTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  dismissedSub: {
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 0.4,
  },
  topBar: { alignItems: "center", gap: 5 },
  alarmLabel: {
    fontSize: 11,
    letterSpacing: 2.5,
    color: Colors.accent,
    fontWeight: "700",
  },
  scheduleName: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "400",
  },
  clockSection: { alignItems: "center" },
  clockTime: {
    fontSize: 76,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -3,
    lineHeight: 80,
  },
  clockAmpm: {
    fontSize: 20,
    color: Colors.accent,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 4,
  },
  cardsStack: { width: "100%", gap: 10 },
  activityCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    gap: 12,
    ...Shadow.card,
  },
  cardLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.textMuted,
    fontWeight: "700",
  },
  activityHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  activityName: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  timeRangeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeChip: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  timeChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  timeArrow: { fontSize: 12, color: Colors.textMuted },
  upNextCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Shadow.card,
  },
  upNextLeft: { gap: 6 },
  upNextActivity: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  upNextTimeChip: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  upNextTimeText: { fontSize: 11, color: Colors.textMuted, fontWeight: "500" },
  upNextBadge: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.textMuted,
    fontWeight: "700",
  },
  actions: { flexDirection: "row", gap: 12, width: "100%" },
  btnDismiss: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 18,
    alignItems: "center",
    ...Shadow.accent,
  },
  btnDismissText: { fontSize: 15, fontWeight: "700", color: Colors.white },
  btnSnooze: {
    flex: 1,
    backgroundColor: "transparent",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 18,
    alignItems: "center",
  },
  btnSnoozeText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  snoozedCard: {
    width: "100%",
    backgroundColor: Colors.warningSoft,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.warning + "30",
    paddingVertical: 20,
    alignItems: "center",
    gap: 6,
  },
  snoozedLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.warning,
    fontWeight: "700",
  },
  snoozedCountdown: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
});
