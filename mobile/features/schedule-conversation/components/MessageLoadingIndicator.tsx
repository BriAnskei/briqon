import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { Colors } from "@/type/theme";

const DOT_SIZE = 8;
const BOUNCE_HEIGHT = -6;
const ANIMATION_DURATION = 400;
const STAGGER_DELAY = 150;

function BouncingDot({ delay }: { delay: number }) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateY, {
          toValue: BOUNCE_HEIGHT,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        // pause so the full loop feels natural
        Animated.delay(STAGGER_DELAY * 3),
      ]),
    );
    bounce.start();
    return () => bounce.stop();
  }, []);

  return <Animated.View style={[s.dot, { transform: [{ translateY }] }]} />;
}

export function MessageLoadingIndicator() {
  return (
    <View style={s.container}>
      <BouncingDot delay={0} />
      <BouncingDot delay={STAGGER_DELAY} />
      <BouncingDot delay={STAGGER_DELAY * 2} />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignSelf: "flex-start", // left-aligned, AI side
    marginLeft: 4,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: Colors.textMuted,
  },
});
