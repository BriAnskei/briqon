export const Colors = {
  // Soft dark grey — not pitch black, surfaces feel warm and lifted
  bg: "#1E1E26", // main background: soft dark grey
  bgCard: "#28283A", // cards: clearly lighter than bg
  bgElevated: "#33334A", // elevated surfaces: inputs, pills, badges
  bgModal: "#242436", // modal sheet background
  border: "#3C3C56", // borders: visible but not harsh
  borderLight: "#4A4A68", // secondary borders and dividers
  accent: "#7B6FFF", // purple — pops well on lighter surfaces
  accentGlow: "rgba(123, 111, 255, 0.22)",
  accentSoft: "rgba(123, 111, 255, 0.13)",
  success: "#1FD8A0",
  successSoft: "rgba(31, 216, 160, 0.12)",
  successGlow: "rgba(31, 216, 160, 0.24)",
  warning: "#F59E0B",
  warningSoft: "rgba(245, 158, 11, 0.12)",
  danger: "#FF5273",
  dangerSoft: "rgba(255, 82, 115, 0.12)",
  diff: "#FFD166",
  diffSoft: "rgba(255, 209, 102, 0.14)",
  textPrimary: "#F2F2FF", // bright white-ish for headlines
  textSecondary: "#A0A0C0", // softer for subtitles — more readable on grey
  textMuted: "#6A6A8A", // muted labels — lifted slightly for legibility
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
    shadowColor: "#7B6FFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  success: {
    shadowColor: "#1FD8A0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 5,
  },
};
