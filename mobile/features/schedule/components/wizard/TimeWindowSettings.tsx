import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors, Radius, Shadow } from "@/type/theme";

import { getMinutesOfDay, durationText } from "@/utils/TimeFormatter";
import { TimeRow } from "@/components/TimeRow";
import { NewScheduleFormState } from "@/type/NewScheduleTypes";
import { Platform } from "react-native";
import { StyleSheet } from "react-native";

type Props = {
	form: NewScheduleFormState;
	patch: (p: Partial<NewScheduleFormState>) => void;
};

// Compares time-of-day only (ignores date component, since the pickers only
// ever edit the time portion). True whenever the end clock-time is at or
// before the start clock-time — covers both overnight wraparound (10pm→6am)
// and the equal-time full-24h case (12am→12am).
function endsNextDay(start: Date, end: Date) {
	const startMins = getMinutesOfDay(start);
	const endMins = getMinutesOfDay(end);
	return endMins <= startMins;
}

export function TimeWindowSettings({ form, patch }: Props) {
	const s = useSStyles();
	const overnight = endsNextDay(form.startTime, form.endTime);

	return (
		<View style={s.body}>
			<Text style={s.title}>Set your time window</Text>
			<Text style={s.sub}>When does your schedule start and end?</Text>

			{/* ── Main time pickers ─────────────────────────────────────────── */}
			<View style={s.gap16}>
				<TimeRow
					label="Start Time"
					icon="play-circle-outline"
					time={form.startTime}
					onPress={() => patch({ showStartPicker: true })}
				/>
				<TimeRow
					label="End Time"
					icon="stop-circle-outline"
					time={form.endTime}
					onPress={() => patch({ showEndPicker: true })}
				/>
			</View>

			{form.showStartPicker && (
				<DateTimePicker
					value={form.startTime}
					mode="time"
					display={Platform.OS === "ios" ? "spinner" : "default"}
					onChange={(_, d) => {
						patch({ showStartPicker: false });
						if (d) patch({ startTime: d });
					}}
				/>
			)}
			{form.showEndPicker && (
				<DateTimePicker
					value={form.endTime}
					mode="time"
					display={Platform.OS === "ios" ? "spinner" : "default"}
					onChange={(_, d) => {
						patch({ showEndPicker: false });
						if (d) patch({ endTime: d });
					}}
				/>
			)}

			{overnight && (
				<View style={s.badge}>
					<Ionicons name="moon-outline" size={13} color={Colors.accent} />
					<Text style={s.badgeText}>Ends next day</Text>
				</View>
			)}

			<View style={s.durationHint}>
				<Ionicons name="hourglass-outline" size={14} color={Colors.textMuted} />
				<Text style={s.durationText}>
					{durationText(form.startTime, form.endTime)}
				</Text>
			</View>
		</View>
	);
}

function useSStyles() {
	const { colors } = useTheme();
	return useMemo(
		() =>
			StyleSheet.create({
				body: { paddingTop: 8 },
				title: {
					fontSize: 22,
					fontWeight: "800",
					color: Colors.textPrimary,
					letterSpacing: -0.5,
					marginBottom: 6,
				},
				sub: {
					fontSize: 13,
					color: Colors.textMuted,
					lineHeight: 20,
					marginBottom: 24,
				},
				gap16: { gap: 16 },
				badge: {
					flexDirection: "row",
					alignItems: "center",
					alignSelf: "flex-start",
					gap: 6,
					marginTop: 14,
					paddingHorizontal: 10,
					paddingVertical: 6,
					borderRadius: Radius.sm,
					backgroundColor: Colors.accentSoft,
					borderWidth: 1,
					borderColor: Colors.accentGlow,
				},
				badgeText: { fontSize: 12, fontWeight: "600", color: Colors.accent },
				durationHint: {
					flexDirection: "row",
					alignItems: "center",
					gap: 7,
					marginTop: 16,
					paddingHorizontal: 4,
				},
				durationText: { fontSize: 12, color: Colors.textMuted },
			}),
		[colors],
	);
}
