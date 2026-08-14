import { Appearance } from "react-native";

// ─── Font Families ─────────────────────────────────────────────────────────────
// Each weight is registered as a separate font family via expo-font so that
// the correct TTF file is selected. Use the matching constant per the spec.

export const FontFamily = {
  // DM Mono — per-weight family names
  mono: "DMMono", // 400 Regular
  monoLight: "DMMono-Light", // 300 Light
  monoMedium: "DMMono-Medium", // 500 Medium
  monoSemiBold: "DMMono-SemiBold", // 600 SemiBold
  // Inter — per-weight family names
  body: "Inter", // 400 Regular
  bodyMedium: "Inter-Medium", // 500 Medium
  bodySemiBold: "Inter-SemiBold", // 600 SemiBold
} as const;

// ─── Typography Scale ─────────────────────────────────────────────────────────
// Single source of truth for every text style in the app.
// Maps directly to the design spec's text-size / font / weight table.

interface TextStyleDef {
  fontSize: number;
  fontFamily: string;
  fontWeight:
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900"
    | "normal"
    | "bold";
  lineHeight?: number;
  letterSpacing?: number;
}

export const TextStyles: Record<string, TextStyleDef> = {
  // Status bar
  statusBar: { fontSize: 11, fontFamily: FontFamily.monoLight, fontWeight: "300" },

  // Header
  headerTitle: { fontSize: 24, fontFamily: FontFamily.bodySemiBold, fontWeight: "600" },

  // Clock tab
  clockTime: {
    fontSize: 88,
    fontFamily: FontFamily.monoLight,
    fontWeight: "300",
    lineHeight: 88,
    letterSpacing: -4,
  },
  clockSeconds: {
    fontSize: 88,
    fontFamily: FontFamily.monoLight,
    fontWeight: "300",
    color: "#3a3a3c",
    lineHeight: 88,
    letterSpacing: -4,
  },
  clockAmpm: { fontSize: 20, fontFamily: FontFamily.bodySemiBold, fontWeight: "600" },
  clockDate: { fontSize: 14, fontFamily: FontFamily.body, fontWeight: "400" },
  nextAlarmPillText: { fontSize: 14, fontFamily: FontFamily.body, fontWeight: "400" },
  nextAlarmTime: { fontSize: 14, fontFamily: FontFamily.monoMedium, fontWeight: "500" },
  worldClockCity: { fontSize: 14, fontFamily: FontFamily.bodyMedium, fontWeight: "500" },
  worldClockTomorrow: { fontSize: 12, fontFamily: FontFamily.body, fontWeight: "400" },
  worldClockTime: { fontSize: 20, fontFamily: FontFamily.monoLight, fontWeight: "300" },

  // Alarms tab
  alarmTime: { fontSize: 36, fontFamily: FontFamily.monoLight, fontWeight: "300" },
  alarmAmpm: { fontSize: 16, fontFamily: FontFamily.body, fontWeight: "400" },
  alarmAIBadge: { fontSize: 10, fontFamily: FontFamily.bodyMedium, fontWeight: "500" },
  alarmLabel: { fontSize: 14, fontFamily: FontFamily.body, fontWeight: "400" },
  alarmNextIn: { fontSize: 12, fontFamily: FontFamily.body, fontWeight: "400" },
  dayOfWeekDot: { fontSize: 11, fontFamily: FontFamily.mono, fontWeight: "400" },
  dayOfWeekDotActive: {
    fontSize: 11,
    fontFamily: FontFamily.monoMedium,
    fontWeight: "500",
  },
  alarmCountFooter: { fontSize: 12, fontFamily: FontFamily.body, fontWeight: "400" },

  // AI tab
  aiDescribeLabel: { fontSize: 14, fontFamily: FontFamily.bodyMedium, fontWeight: "500" },
  aiTextareaPlaceholder: { fontSize: 14, fontFamily: FontFamily.body, fontWeight: "400" },
  aiGenerateBtn: { fontSize: 14, fontFamily: FontFamily.bodyMedium, fontWeight: "500" },
  aiTryExample: { fontSize: 12, fontFamily: FontFamily.body, fontWeight: "400" },
  aiSamplePrompt: { fontSize: 14, fontFamily: FontFamily.body, fontWeight: "400" },
  aiThinkingStep: { fontSize: 14, fontFamily: FontFamily.body, fontWeight: "400" },
  aiResultTime: { fontSize: 30, fontFamily: FontFamily.monoLight, fontWeight: "300" },
  aiAlarmsGenerated: {
    fontSize: 14,
    fontFamily: FontFamily.bodyMedium,
    fontWeight: "500",
  },
  aiAddAlarmsBtn: { fontSize: 14, fontFamily: FontFamily.bodyMedium, fontWeight: "500" },

  // Bottom tab bar
  tabBarLabel: { fontSize: 10, fontFamily: FontFamily.bodyMedium, fontWeight: "500" },

  // Modal
  modalTitle: { fontSize: 18, fontFamily: FontFamily.bodySemiBold, fontWeight: "600" },
  modalFieldLabel: {
    fontSize: 12,
    fontFamily: FontFamily.bodyMedium,
    fontWeight: "500",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  modalTimeInput: { fontSize: 18, fontFamily: FontFamily.mono, fontWeight: "400" },
  modalLabelInput: { fontSize: 14, fontFamily: FontFamily.body, fontWeight: "400" },
  modalDayBtn: { fontSize: 12, fontFamily: FontFamily.monoMedium, fontWeight: "500" },
  modalAddAlarmBtn: {
    fontSize: 14,
    fontFamily: FontFamily.bodySemiBold,
    fontWeight: "600",
  },
};

// ─── Light palette ──────────────────────────────────────────────────────────────

const lightTheme = {
  // Core surfaces
  bg: "#f2f2f7", // --background
  bgCard: "#ffffff", // --card
  bgElevated: "#e5e5ea", // --secondary / bg-secondary
  bgModal: "#ffffff", // --card (modal sheets)

  // Borders & dividers
  border: "rgba(0,0,0,0.1)", // --border
  borderLight: "rgba(0,0,0,0.06)", // subtle variant
  divider: "rgba(0,0,0,0.05)", // hairline dividers

  // Text
  textPrimary: "#1c1c1e", // --foreground
  textSecondary: "#6c6c70", // --muted-foreground (renamed from secondary)
  textMuted: "#6c6c70", // kept for legacy compatibility
  disabled: "#b8b8bc",

  // Accent / CTA
  accent: "#ff9f0a", // --primary (amber)
  accentSoft: "rgba(255, 159, 10, 0.12)",
  accentGlow: "rgba(255, 159, 10, 0.16)",

  // Semantic states
  success: "#30B05B",
  successSoft: "rgba(48, 176, 91, 0.12)",
  danger: "#ff3b30", // --destructive
  dangerSoft: "rgba(255, 59, 48, 0.10)",
  warning: "#ff9f0a",
  warningSoft: "rgba(255, 159, 10, 0.10)",

  // Toggle
  switchBackground: "#c7c7cc", // --switch-background

  // White
  white: "#ffffff",
};

// ─── Dark palette ───────────────────────────────────────────────────────────────

const darkTheme = {
  // Core surfaces
  bg: "#000000", // --background
  bgCard: "#111111", // --card
  bgElevated: "#1c1c1e", // --secondary / bg-secondary
  bgModal: "#111111", // --card (modal sheets)

  // Borders & dividers
  border: "rgba(255,255,255,0.08)", // --border
  borderLight: "rgba(255,255,255,0.04)", // subtle variant
  divider: "rgba(255,255,255,0.04)", // hairline dividers

  // Text
  textPrimary: "#f5f5f5", // --foreground
  textSecondary: "#8e8e93", // --muted-foreground (renamed from secondary)
  textMuted: "#8e8e93", // kept for legacy compatibility
  disabled: "#4a4a4f",

  // Accent / CTA
  accent: "#ff9f0a", // --primary (amber)
  accentSoft: "rgba(255, 159, 10, 0.12)",
  accentGlow: "rgba(255, 159, 10, 0.16)",

  // Semantic states
  success: "#30B05B",
  successSoft: "rgba(48, 176, 91, 0.12)",
  danger: "#ff453a", // --destructive (brighter in dark)
  dangerSoft: "rgba(255, 69, 58, 0.10)",
  warning: "#ff9f0a",
  warningSoft: "rgba(255, 159, 10, 0.10)",

  // Toggle
  switchBackground: "#3a3a3c", // --switch-background

  // White
  white: "#ffffff",
};

export type Theme = typeof darkTheme;
export type ColorScheme = "light" | "dark";

export const lightThemePalette = lightTheme;
export const darkThemePalette = darkTheme;

// ─── Border Radius Scale ────────────────────────────────────────────────────────

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16, // rounded-2xl (spec: card container = 16px / rounded-2xl)
  xl: 20, // rounded-3xl
  full: 999,
};

// ─── Shadows ────────────────────────────────────────────────────────────────────

export const Shadow = {
  accent: {
    shadowColor: "#ff9f0a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 10,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
};

// ─── Component Size Constants ───────────────────────────────────────────────────

export const ComponentSize = {
  // Buttons
  iconButton: 32, // theme toggle, add alarm (+) button
  primaryBtnVerticalPadding: 12, // py-3
  addAlarmModalBtnVerticalPadding: 14, // py-3.5

  // Toggles
  toggleTrackWidth: 48,
  toggleTrackHeight: 28,
  toggleKnobSize: 24,

  // Pills
  nextAlarmPillHorizontal: 20, // px-5
  nextAlarmPillVertical: 12, // py-3

  // Chips / dots
  dayOfWeekDotSize: 24,
  aiStepCircleSize: 20,

  // Modals
  modalTopRadius: 24, // rounded-t-3xl

  // Inputs
  inputHorizontal: 16, // px-4
  inputVertical: 12, // py-3
  inputRadius: 12, // rounded-xl

  // Day selector buttons (modal)
  daySelectorHeight: 36,
  daySelectorRadius: 12,

  // Bottom tab bar
  tabBarVerticalPadding: 12, // py-3
  tabBarBottomPadding: 20, // pb-5
} as const;

// ─── Reactive color store ───────────────────────────────────────────────────────

let activeScheme: ColorScheme =
  (Appearance.getColorScheme() ?? "dark") === "dark" ? "dark" : "light";

let activeTheme: Theme = activeScheme === "dark" ? darkTheme : lightTheme;

export function setActiveTheme(scheme: ColorScheme) {
  if (scheme === activeScheme) return;
  activeScheme = scheme;
  activeTheme = scheme === "dark" ? darkTheme : lightTheme;
}

export const Colors = new Proxy({} as Theme, {
  get: (_target, prop: string) => (activeTheme as Record<string, unknown>)[prop],
}) as Theme;
