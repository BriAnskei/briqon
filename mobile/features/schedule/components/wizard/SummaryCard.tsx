import { useTheme } from "@/context/ThemeContext";
import { useMemo, Fragment } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Radius, Shadow } from "@/type/theme";
import { formatMinutes } from "@/utils/TimeFormatter";
import {
	PersonalSummary,
	EventSummary,
} from "@/features/schedule/hooks/form/useWizardForm";

export type SummaryItem = { label: string; value: string };

export function SummaryCard({ items }: { items: SummaryItem[] }) {
	const s = useSStyles();
	return (
		<View style={s.card}>
			{items.map((it, i) => (
				<Fragment key={it.label}>
					{i > 0 && <View style={s.divider} />}
					<View style={s.item}>
						<Text style={s.value}>{it.value}</Text>
						<Text style={s.label}>{it.label}</Text>
					</View>
				</Fragment>
			))}
		</View>
	);
}

export function personalSummaryItems(s: PersonalSummary): SummaryItem[] {
	return [
		{ label: "Window", value: formatMinutes(s.windowMinutes) },
		...(s.appointmentMinutes > 0
			? [
					{
						label: "Appts",
						value: formatMinutes(s.appointmentMinutes),
					},
				]
			: []),
		...(s.mealMinutes > 0
			? [{ label: "Meals", value: formatMinutes(s.mealMinutes) }]
			: []),
		{
			label: "Remaining",
			value: formatMinutes(s.remainingMinutes),
		},
	];
}

export function eventSummaryItems(s: EventSummary): SummaryItem[] {
	return [
		{
			label: "Event Hours",
			value: formatMinutes(s.windowMinutes),
		},
		{ label: "Items", value: String(s.totalItems) },
		{
			label: "Remaining",
			value: formatMinutes(s.remainingMinutes),
		},
	];
}

function useSStyles() {
	const { colors } = useTheme();
	return useMemo(
		() =>
			StyleSheet.create({
				card: {
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: Colors.bgCard,
					borderRadius: Radius.lg,
					borderWidth: 1,
					borderColor: Colors.border,
					paddingVertical: 14,
					paddingHorizontal: 8,
					marginBottom: 20,
					...Shadow.card,
				},
				item: { flex: 1, alignItems: "center" },
				divider: { width: 1, height: 28, backgroundColor: Colors.borderLight },
				value: {
					fontSize: 16,
					fontWeight: "800",
					color: Colors.textPrimary,
					marginBottom: 2,
				},
				label: { fontSize: 11, fontWeight: "600", color: Colors.textSecondary },
			}),
		[colors],
	);
}
