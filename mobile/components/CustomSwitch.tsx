import { useMemo } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { Colors, ComponentSize } from "@/type/theme";

/**
 * Custom switch matching the design spec:
 *  - Track: 48 × 28 (rounded-full)
 *  - Knob: 24 × 24 (rounded-full)
 *  - ON track → bg-primary (#ff9f0a)
 *  - OFF track → bg-switch-bg (#c7c7cc light / #3a3a3c dark)
 *  - Knob → bg-white
 */
export function CustomSwitch({
  value,
  onValueChange,
  disabled,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const animation = useMemo(() => new Animated.Value(value ? 1 : 0), []);

  const trackColor = disabled
    ? Colors.disabled
    : value
      ? Colors.accent
      : Colors.switchBackground;

  const knobTranslate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 26],
  });

  const handlePress = () => {
    const next = !value;
    Animated.timing(animation, {
      toValue: next ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onValueChange(next);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled}
      style={[styles.track, { backgroundColor: Colors.switchBackground }]}
    >
      <Animated.View
        style={[
          styles.trackInner,
          {
            backgroundColor: trackColor,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Animated.View
          style={[styles.knob, { transform: [{ translateX: knobTranslate }] }]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: ComponentSize.toggleTrackWidth,
    height: ComponentSize.toggleTrackHeight,
    borderRadius: ComponentSize.toggleTrackHeight / 2,
    padding: 2,
  },
  trackInner: {
    width: "100%",
    height: "100%",
    borderRadius: ComponentSize.toggleTrackHeight / 2,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  knob: {
    width: ComponentSize.toggleKnobSize,
    height: ComponentSize.toggleKnobSize,
    borderRadius: ComponentSize.toggleKnobSize / 2,
    backgroundColor: Colors.white,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
