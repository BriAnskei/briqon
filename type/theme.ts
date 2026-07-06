export const Colors = {
  // Pure black base — flat, minimal, high contrast
  bg: "#000000", // main background
  bgCard: "#111111", // surface: cards, sections
  bgElevated: "#1A1A1A", // elevated surfaces: inputs, pills, badges
  bgModal: "#111111", // modal sheet background
  border: "#2A2A2A", // standard border
  borderLight: "#3A3A3A", // secondary/active borders
  divider: "#222222", // hairline dividers between rows/sections

  // Accent — white replaces purple as the single "pop" color
  accent: "#C2C2C2", // dimmed white — softer glare on buttons/highlights
  accentGlow: "rgba(194, 194, 194, 0.16)",
  accentSoft: "rgba(194, 194, 194, 0.08)",
  // Semantic states — kept muted color for scannability, everything else grayscale
  success: "#4ADE80",
  successSoft: "rgba(74, 222, 128, 0.10)",
  successGlow: "rgba(74, 222, 128, 0.20)",

  danger: "#F87171",
  dangerSoft: "rgba(248, 113, 113, 0.10)",

  warning: "#B3B3B3", // desaturated — no longer amber
  warningSoft: "rgba(255, 255, 255, 0.06)",

  diff: "#B3B3B3", // desaturated — no longer yellow
  diffSoft: "rgba(255, 255, 255, 0.06)",

  textPrimary: "#FFFFFF",
  textSecondary: "#B3B3B3",
  textMuted: "#6B6B6B", // = Disabled in your table
  disabled: "#6B6B6B",
  white: "#FFFFFF",
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  full: 999,
};

export const Shadow = {
  accent: {
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 10,
  },
  success: {
    shadowColor: "#4ADE80",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 10,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 3,
  },
};
