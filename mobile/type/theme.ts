import { Appearance } from "react-native";

// Dark palette — the app's current flat, high-contrast look.
const darkTheme = {
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

// Light palette — inverse of the dark grayscale, with dark text.
const lightTheme = {
	bg: "#FFFFFF", // main background
	bgCard: "#F5F5F5", // surface: cards, sections
	bgElevated: "#ECECEC", // elevated surfaces: inputs, pills, badges
	bgModal: "#FFFFFF", // modal sheet background
	border: "#DADADA", // standard border
	borderLight: "#C4C4C4", // secondary/active borders
	divider: "#E6E6E6", // hairline dividers between rows/sections

	accent: "#3A3A3A", // dimmed near-black — softer glare on buttons/highlights
	accentGlow: "rgba(0, 0, 0, 0.08)",
	accentSoft: "rgba(0, 0, 0, 0.04)",
	success: "#16A34A",
	successSoft: "rgba(22, 163, 74, 0.12)",
	successGlow: "rgba(22, 163, 74, 0.18)",

	danger: "#DC2626",
	dangerSoft: "rgba(220, 38, 38, 0.10)",

	warning: "#6B6B6B",
	warningSoft: "rgba(0, 0, 0, 0.05)",

	diff: "#6B6B6B",
	diffSoft: "rgba(0, 0, 0, 0.05)",

	textPrimary: "#0A0A0A",
	textSecondary: "#555555",
	textMuted: "#9A9A9A",
	disabled: "#9A9A9A",
	white: "#FFFFFF",
};

export type Theme = typeof darkTheme;
export type ColorScheme = "light" | "dark";

export const lightThemePalette = lightTheme;
export const darkThemePalette = darkTheme;

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

// ---------------------------------------------------------------------------
// Reactive color store.
//
// `Colors` is a live proxy: every `Colors.x` read returns the value for the
// *currently active* color scheme. This lets the existing inline usages
// (e.g. `color={Colors.accent}`) follow the device theme automatically, and
// lets module-scope `StyleSheet.create({... Colors.x ...})` blocks be turned
// into render-time `useStyles()` hooks (see @/context/ThemeContext).
// ---------------------------------------------------------------------------

let activeScheme: ColorScheme =
	(Appearance.getColorScheme() ?? "dark") === "dark" ? "dark" : "light";

let activeTheme: Theme = activeScheme === "dark" ? darkTheme : lightTheme;

export function setActiveTheme(scheme: ColorScheme) {
	if (scheme === activeScheme) return;
	activeScheme = scheme;
	activeTheme = scheme === "dark" ? darkTheme : lightTheme;
}

export const Colors = new Proxy({} as Theme, {
	get: (_target, prop: string) =>
		(activeTheme as Record<string, unknown>)[prop],
}) as Theme;
