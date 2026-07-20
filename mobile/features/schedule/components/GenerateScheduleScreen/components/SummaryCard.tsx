import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Radius } from "@/type/theme";
import { ScheduleSummary } from "@/src/models/summaries.model";
import { SubSummary } from "@/src/models/sub_summaries.model";

interface SummaryCardProps {
	summaries: ScheduleSummary[];
	subSummaries: SubSummary[];
}

export function SummaryCard({ summaries, subSummaries }: SummaryCardProps) {
	const s = useSStyles();
	return (
		<View style={s.summaryCard}>
			<Text style={s.summaryLabel}>Summary</Text>
			<View style={s.categoryList}>
				{summaries.map((cat, i) => {
					const subs = subSummaries.filter((sub) => sub.summary_id === cat.id);
					return (
						<View
							key={cat.id}
							style={[
								s.categoryBlock,
								i !== summaries.length - 1 && s.categoryBlockDivider,
							]}
						>
							<View style={s.categoryHeaderRow}>
								<Text style={s.categoryName}>{cat.name}</Text>
								<Text style={s.categoryTotal}>{cat.total}</Text>
							</View>
							{subs.length > 0 && (
								<View style={s.subActivityList}>
									{subs.map((sub) => (
										<View key={sub.id} style={s.subActivityRow}>
											<View style={s.subActivityDot} />
											<Text style={s.subActivityName}>{sub.name}</Text>
											<Text style={s.subActivityTotal}>{sub.total}</Text>
										</View>
									))}
								</View>
							)}
						</View>
					);
				})}
			</View>
		</View>
	);
}

function useSStyles() {
	const { colors } = useTheme();
	return useMemo(
		() =>
			StyleSheet.create({
				summaryCard: {
					borderWidth: 1,
					borderColor: Colors.border,
					borderRadius: Radius.lg,
					backgroundColor: Colors.bgCard,
					padding: 16,
					gap: 12,
				},
				summaryLabel: {
					fontSize: 11,
					fontWeight: "700",
					color: Colors.textMuted,
					letterSpacing: 0.5,
					textTransform: "uppercase",
				},

				categoryList: { gap: 14 },
				categoryBlock: { gap: 8, paddingBottom: 14 },
				categoryBlockDivider: {
					borderBottomWidth: 1,
					borderBottomColor: Colors.divider,
				},
				categoryHeaderRow: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
				},
				categoryName: {
					fontSize: 14,
					fontWeight: "700",
					color: Colors.textPrimary,
				},
				categoryTotal: {
					fontSize: 13,
					fontWeight: "600",
					color: Colors.textSecondary,
				},

				subActivityList: { gap: 6, paddingLeft: 4 },
				subActivityRow: { flexDirection: "row", alignItems: "center", gap: 8 },
				subActivityDot: {
					width: 4,
					height: 4,
					borderRadius: 2,
					backgroundColor: Colors.textMuted,
				},
				subActivityName: { flex: 1, fontSize: 12, color: Colors.textSecondary },
				subActivityTotal: {
					fontSize: 12,
					color: Colors.textMuted,
					fontWeight: "500",
				},
			}),
		[colors],
	);
}
