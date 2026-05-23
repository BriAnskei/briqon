import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Colors } from "@/type/theme";

// ─── Logo Mark ────────────────────────────────────────────────────────────────

function LogoMark() {
  return (
    <View style={logo.card}>
      {/* Accent top bar */}
      <View style={logo.accentBar} />

      {/* Clock face */}
      <View style={logo.clockOuter}>
        <View style={logo.clockInner}>
          {/* Hour hand */}
          <View style={logo.hourHand} />
          {/* Minute hand */}
          <View style={logo.minuteHand} />
          {/* Center dot */}
          <View style={logo.centerDot} />
        </View>
      </View>

      {/* Schedule lines */}
      <View style={logo.lineWrap}>
        <View style={logo.linePrimary} />
        <View style={logo.lineSecondary} />
      </View>

      {/* Corner bells */}
      <View style={[logo.bell, logo.bellLeft]} />
      <View
        style={[logo.bell, logo.bellRight, { backgroundColor: Colors.success }]}
      />
    </View>
  );
}

const logo = StyleSheet.create({
  card: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.accent,
    opacity: 0.8,
  },

  // Clock
  clockOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    opacity: 0.9,
    alignItems: "center",
    justifyContent: "center",
  },
  clockInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  hourHand: {
    position: "absolute",
    width: 2,
    height: 10,
    backgroundColor: Colors.accent,
    borderRadius: 1,
    bottom: "50%",
    left: "50%",
    marginLeft: -1,
    transformOrigin: "bottom",
    transform: [{ rotate: "-45deg" }, { translateY: 2 }],
  },
  minuteHand: {
    position: "absolute",
    width: 1.5,
    height: 12,
    backgroundColor: Colors.success,
    borderRadius: 1,
    bottom: "50%",
    left: "50%",
    marginLeft: -0.75,
    transform: [{ rotate: "45deg" }, { translateY: 2 }],
  },
  centerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },

  // Schedule lines
  lineWrap: {
    position: "absolute",
    bottom: 12,
    left: 16,
    right: 16,
    gap: 5,
  },
  linePrimary: {
    height: 2.5,
    borderRadius: 2,
    backgroundColor: Colors.accent,
    opacity: 0.5,
  },
  lineSecondary: {
    height: 2,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },

  // Corner accent dots (bells simplified)
  bell: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    opacity: 0.6,
    top: 12,
  },
  bellLeft: { left: 12 },
  bellRight: { right: 12 },
});

// ─── SplashScreen ─────────────────────────────────────────────────────────────

export default function SplashScreen() {
  return (
    <View style={s.root}>
      {/* ── Ambient blobs ── */}
      <View style={[s.blob, s.blobTopLeft]} pointerEvents="none" />
      <View style={[s.blob, s.blobBottomRight]} pointerEvents="none" />

      {/* ── Center ── */}
      <View style={s.center}>
        <LogoMark />
        <Text style={s.wordmark}>Briqon</Text>
        <Text style={s.tagline}>Smart Alarm Scheduling</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.09,
  },
  blobTopLeft: {
    width: 320,
    height: 320,
    backgroundColor: Colors.accent,
    top: -80,
    left: -100,
  },
  blobBottomRight: {
    width: 260,
    height: 260,
    backgroundColor: Colors.success,
    bottom: -60,
    right: -80,
  },
  center: {
    alignItems: "center",
    gap: 20,
    zIndex: 2,
  },
  wordmark: {
    fontSize: 34,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textMuted,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: -6,
  },
});
