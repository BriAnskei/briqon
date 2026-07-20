import { View, Text, StyleSheet } from "react-native";
import { useMemo } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ToastConfig, ToastConfigParams } from "react-native-toast-message";
import { Radius, Shadow } from "@/type/theme";
import { useTheme } from "@/context/ThemeContext";

// ── Per-type design tokens ────────────────────────────────────────────────────

type ToastVariant = "success" | "error" | "info" | "warning";

const ICONS: Record<
	ToastVariant,
	keyof typeof MaterialCommunityIcons.glyphMap
> = {
	success: "check-circle-outline",
	error: "robot-confused-outline",
	info: "information-outline",
	warning: "alert-circle-outline",
};

// ── Shared toast card ─────────────────────────────────────────────────────────

function ToastCard({
	type,
	text1,
	text2,
}: ToastConfigParams<unknown> & { type: ToastVariant }) {
	const { colors } = useTheme();

	const s = useMemo(
		() =>
			StyleSheet.create({
				card: {
					flexDirection: "row",
					alignItems: "center",
					width: "90%",
					backgroundColor: colors.bgCard,
					borderRadius: Radius.lg,
					borderWidth: 1,
					borderColor: colors.border,
					overflow: "hidden",
					minHeight: 64,
				},
				accentBar: {
					width: 4,
					alignSelf: "stretch",
				},
				iconWrap: {
					width: 40,
					height: 40,
					borderRadius: Radius.md,
					alignItems: "center",
					justifyContent: "center",
					marginHorizontal: 12,
					flexShrink: 0,
				},
				textWrap: {
					flex: 1,
					paddingVertical: 12,
					paddingRight: 14,
					gap: 2,
				},
				title: {
					fontSize: 13,
					fontWeight: "700",
					color: colors.textPrimary,
					letterSpacing: 0.1,
				},
				body: {
					fontSize: 12,
					color: colors.textSecondary,
					lineHeight: 17,
				},
			}),
		[colors],
	);

	const tokens = {
		success: { accent: colors.success, soft: colors.successSoft },
		error: { accent: colors.danger, soft: colors.dangerSoft },
		info: { accent: colors.accent, soft: colors.accentSoft },
		warning: { accent: colors.warning, soft: colors.warningSoft },
	}[type];

	return (
		<View style={[s.card, Shadow.card]}>
			{/* Left accent bar */}
			<View style={[s.accentBar, { backgroundColor: tokens.accent }]} />

			{/* Icon bubble */}
			<View style={[s.iconWrap, { backgroundColor: tokens.soft }]}>
				<MaterialCommunityIcons
					name={ICONS[type]}
					size={22}
					color={tokens.accent}
				/>
			</View>

			{/* Text */}
			<View style={s.textWrap}>
				{!!text1 && (
					<Text style={s.title} numberOfLines={1}>
						{text1}
					</Text>
				)}
				{!!text2 && (
					<Text style={s.body} numberOfLines={3}>
						{text2}
					</Text>
				)}
			</View>
		</View>
	);
}

// ── Exported config builder ───────────────────────────────────────────────────
// Returned fresh on each render so the toast picks up the current theme.

export function buildToastConfig(): ToastConfig {
	return {
		success: (props) => <ToastCard {...props} type="success" />,
		error: (props) => <ToastCard {...props} type="error" />,
		info: (props) => <ToastCard {...props} type="info" />,
		warning: (props) => <ToastCard {...props} type="warning" />,
	};
}
