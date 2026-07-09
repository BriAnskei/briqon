import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Colors, Radius } from "@/type/theme";

const FAKE_ROWS = 8;

function PulseBar({ style }: { style: object }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.3, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[style, animatedStyle]} />;
}

export function ScheduleSkeletonBlock() {
  return (
    <View style={s.block}>
      <View style={s.timeline}>
        {Array.from({ length: FAKE_ROWS }).map((_, index) => (
          <View key={index} style={s.tlRow}>
            <View style={s.tlLeft}>
              <PulseBar style={s.fakeTime} />
              {index < FAKE_ROWS - 1 && <View style={s.tlLine} />}
            </View>

            <PulseBar style={s.tlDot} />

            <View style={s.tlCard}>
              <PulseBar style={s.fakeTitle} />
              <PulseBar style={s.fakeMeta} />
            </View>
          </View>
        ))}
      </View>

      <View style={s.footer}>
        <View style={s.footerDot} />
        <Text style={s.footerText}>
          Generating your schedule… This might take a few minutes since the
          developer can’t afford a GPU yet 😅
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  block: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    overflow: "hidden",
  },
  timeline: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
  },
  tlRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  tlLeft: {
    width: 58,
    alignItems: "flex-end",
    paddingRight: 12,
    paddingTop: 9,
  },
  fakeTime: {
    width: 32,
    height: 9,
    borderRadius: 4,
    backgroundColor: Colors.bgElevated,
  },
  tlLine: {
    width: 1,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: 7,
    minHeight: 24,
  },
  tlDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.bgElevated,
    marginTop: 11,
    marginRight: 12,
  },
  tlCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 7,
  },
  fakeTitle: {
    width: "60%",
    height: 11,
    borderRadius: 4,
    backgroundColor: Colors.bgElevated,
  },
  fakeMeta: {
    width: "40%",
    height: 9,
    borderRadius: 4,
    backgroundColor: Colors.bgElevated,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginHorizontal: 14,
    marginBottom: 12,
    paddingVertical: 9,
    paddingHorizontal: 11,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    flexShrink: 0,
  },
  footerText: {
    fontSize: 11,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },
});
