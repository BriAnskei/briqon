import DateTimePicker, {
	type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	Modal,
	Platform,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { Colors, Radius, Shadow } from "@/type/theme";

interface Props {
	isOpen: boolean;
	close: () => void;
}

type DateMode = "today" | "tomorrow" | "range" | "specific" | null;

const DAYS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

export function SetActiveModal({ isOpen, close }: Props) {
	const s = useSStyles();

	const [dateMode, setDateMode] = useState<DateMode>(null);

	// "range" (days of week) state
	const [selectedDays, setSelectedDays] = useState<string[]>([]);
	const [disabledDays] = useState<string[]>([]);
	const [rangeStartsAt, setRangeStartsAt] = useState<Date>(new Date());
	const [showRangeStartsPicker, setShowRangeStartsPicker] = useState(false);

	// "specific" date state
	const [specificDate, setSpecificDate] = useState<Date>(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);

	const [recurring, setRecurring] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const resetState = useCallback(() => {
		setDateMode(null);
		setSelectedDays([]);
		setRangeStartsAt(new Date());
		setShowRangeStartsPicker(false);
		setSpecificDate(new Date());
		setShowDatePicker(false);
		setRecurring(false);
		setIsSubmitting(false);
	}, []);

	const handleClose = useCallback(() => {
		resetState();
		close();
	}, [resetState, close]);

	const handleModeSelect = useCallback((mode: Exclude<DateMode, null>) => {
		setDateMode(mode);
		if (mode !== "range") {
			setShowRangeStartsPicker(false);
		}
		if (mode === "specific") {
			setShowDatePicker(true);
		} else {
			setShowDatePicker(false);
		}
	}, []);

	const toggleDay = useCallback(
		(day: string) => {
			if (disabledDays.includes(day)) return;
			setSelectedDays((prev) =>
				prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
			);
		},
		[disabledDays],
	);

	const handleRangeStartsAtChange = useCallback(
		(event: DateTimePickerEvent, selectedTime?: Date) => {
			if (Platform.OS === "android") {
				setShowRangeStartsPicker(false);
			}
			if (event.type === "set" && selectedTime) {
				setRangeStartsAt(selectedTime);
			}
		},
		[],
	);

	const handleDateChange = useCallback(
		(event: DateTimePickerEvent, selectedDate?: Date) => {
			if (Platform.OS === "android") {
				setShowDatePicker(false);
			}
			if (event.type === "set" && selectedDate) {
				setSpecificDate(selectedDate);
			}
		},
		[],
	);

	const isConfirmBlocked = useMemo(() => {
		if (isSubmitting) return true;
		if (dateMode === null) return true;
		if (dateMode === "range" && selectedDays.length === 0) return true;
		return false;
	}, [isSubmitting, dateMode, selectedDays]);

	const summary = useMemo(() => {
		if (dateMode === "today") {
			return recurring ? "Today, repeating weekly" : "Active today";
		}
		if (dateMode === "tomorrow") {
			return recurring ? "Tomorrow, repeating weekly" : "Active tomorrow";
		}
		if (dateMode === "range") {
			if (selectedDays.length === 0) return "Select at least one day";
			const dayList = selectedDays.join(", ");
			return `${dayList} · starts at ${formatTime(rangeStartsAt)}${
				recurring ? " · repeats weekly" : ""
			}`;
		}
		if (dateMode === "specific") {
			return `Active on ${formatDate(specificDate)}`;
		}
		return "";
	}, [dateMode, recurring, selectedDays, rangeStartsAt, specificDate]);

	const handleConfirm = useCallback(() => {
		if (isConfirmBlocked) return;
		setIsSubmitting(true);

		// TODO: wire real activation/save logic here.
		// TODO: run conflict validation (e.g. ScheduleConflictValidator) before
		// committing, and surface a conflict-resolution modal if a clash is found.

		setTimeout(() => {
			resetState();
			close();
		}, 400);
	}, [isConfirmBlocked, resetState, close]);

	useEffect(() => {}, []);

	return (
		<Modal
			visible={isOpen}
			animationType="slide"
			transparent
			onRequestClose={handleClose}
		>
			<View style={s.overlay}>
				<View style={s.sheet}>
					<View style={s.handle} />

					{/* ── Header ── */}
					<View style={s.header}>
						<Text style={s.title}>When should this be active?</Text>
						<TouchableOpacity
							onPress={handleClose}
							style={s.closeBtn}
							activeOpacity={0.8}
						>
							<Text style={s.closeBtnText}>✕</Text>
						</TouchableOpacity>
					</View>

					{/* ── Live summary ── */}
					{dateMode !== null && (
						<View style={s.summaryCard}>
							<View style={s.summaryDot} />
							<Text style={s.summaryText}>{summary}</Text>
						</View>
					)}

					{/* ── Options ── */}
					<ScrollView
						style={s.scrollArea}
						contentContainerStyle={s.scrollContent}
						showsVerticalScrollIndicator={false}
						keyboardShouldPersistTaps="handled"
					>
						{/* Quick picks */}
						<Text style={s.sectionLabel}>Quick Pick</Text>
						<View style={s.pillRow}>
							<OptionPill
								label="Today"
								selected={dateMode === "today"}
								onPress={() => handleModeSelect("today")}
							/>
							<OptionPill
								label="Tomorrow"
								selected={dateMode === "tomorrow"}
								onPress={() => handleModeSelect("tomorrow")}
							/>
						</View>

						{/* Day selection */}
						<Text style={s.sectionLabel}>Days of the Week</Text>
						<View style={s.optionCard}>
							<TouchableOpacity
								style={s.optionCardHeader}
								onPress={() => handleModeSelect("range")}
								activeOpacity={0.8}
							>
								<View style={s.optionCardLeft}>
									<Text style={s.optionCardTitle}>Select Days</Text>
									<Text style={s.optionCardSubtitle}>
										{dateMode === "range" && selectedDays.length > 0
											? `${selectedDays.length} day${selectedDays.length > 1 ? "s" : ""} selected`
											: "e.g. Monday, Wednesday, Friday"}
									</Text>
								</View>
								<Radio active={dateMode === "range"} />
							</TouchableOpacity>

							{dateMode === "range" && (
								<DayRangeExpanded
									selectedDays={selectedDays}
									onToggleDay={toggleDay}
									disabledDays={disabledDays}
									startsAt={rangeStartsAt}
									showStartsPicker={showRangeStartsPicker}
									onOpenStartsPicker={() => setShowRangeStartsPicker(true)}
									onStartsAtChange={handleRangeStartsAtChange}
									onStartsAtPickerDismiss={() =>
										setShowRangeStartsPicker(false)
									}
								/>
							)}
						</View>

						{/* Specific date */}
						<Text style={s.sectionLabel}>Specific Date</Text>
						<View style={s.optionCard}>
							<TouchableOpacity
								style={s.optionCardHeader}
								onPress={() => handleModeSelect("specific")}
								activeOpacity={0.8}
							>
								<View style={s.optionCardLeft}>
									<Text style={s.optionCardTitle}>Pick a Date</Text>
									<Text style={s.optionCardSubtitle}>
										{dateMode === "specific"
											? formatDate(specificDate)
											: "Choose from calendar"}
									</Text>
								</View>
								<Radio active={dateMode === "specific"} />
							</TouchableOpacity>

							{dateMode === "specific" && (
								<View style={s.datePickerWrap}>
									{showDatePicker ? (
										<DateTimePicker
											value={specificDate}
											mode="date"
											display={Platform.OS === "ios" ? "inline" : "default"}
											minimumDate={new Date()}
											onChange={handleDateChange}
										/>
									) : (
										<TouchableOpacity
											style={s.changeDateBtn}
											onPress={() => setShowDatePicker(true)}
											activeOpacity={0.8}
										>
											<Text style={s.changeDateText}>
												📅 {formatDate(specificDate)} · Tap to change
											</Text>
										</TouchableOpacity>
									)}
								</View>
							)}
						</View>

						{/* Repeat toggle — hidden for specific date */}
						{dateMode !== "specific" && (
							<View style={s.repeatRow}>
								<View style={s.repeatLeft}>
									<Text style={s.repeatTitle}>Repeat every week</Text>
									<Text style={s.repeatSubtitle}>
										Apply this schedule on a weekly basis
									</Text>
								</View>
								<Switch
									value={recurring}
									onValueChange={setRecurring}
									trackColor={{
										false: Colors.bgElevated,
										true: Colors.accent,
									}}
									thumbColor={Colors.white}
								/>
							</View>
						)}
					</ScrollView>

					{/* ── Actions ── */}
					<View style={s.actions}>
						<TouchableOpacity
							style={s.cancelBtn}
							onPress={handleClose}
							activeOpacity={0.8}
						>
							<Text style={s.cancelText}>Cancel</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[s.confirmBtn, isConfirmBlocked && s.confirmBtnDisabled]}
							onPress={handleConfirm}
							activeOpacity={0.88}
							disabled={isConfirmBlocked}
						>
							<Text
								style={[
									s.confirmText,
									isConfirmBlocked && s.confirmTextDisabled,
								]}
							>
								{isSubmitting ? "Scheduling…" : "Confirm"}
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
}

function OptionPill({
	label,
	selected,
	onPress,
}: {
	label: string;
	selected: boolean;
	onPress: () => void;
}) {
	const s = useSStyles();
	return (
		<TouchableOpacity
			style={[s.pill, selected && s.pillActive]}
			onPress={onPress}
			activeOpacity={0.8}
		>
			<Text style={[s.pillText, selected && s.pillTextActive]}>{label}</Text>
		</TouchableOpacity>
	);
}

function DayRangeExpanded({
	selectedDays,
	onToggleDay,
	disabledDays,
	startsAt,
	showStartsPicker,
	onOpenStartsPicker,
	onStartsAtChange,
	onStartsAtPickerDismiss,
}: {
	selectedDays: string[];
	onToggleDay: (day: string) => void;
	disabledDays: string[];
	startsAt: Date;
	showStartsPicker: boolean;
	onOpenStartsPicker: () => void;
	onStartsAtChange: (event: DateTimePickerEvent, date?: Date) => void;
	onStartsAtPickerDismiss: () => void;
}) {
	const s = useSStyles();
	return (
		<View style={s.dayRangeWrap}>
			<View style={s.dayChipRow}>
				{DAYS.map((day) => {
					const active = selectedDays.includes(day);
					const disabled = disabledDays.includes(day);
					return (
						<TouchableOpacity
							key={day}
							style={[
								s.dayChip,
								active && s.dayChipActive,
								disabled && s.dayChipDisabled,
							]}
							onPress={() => onToggleDay(day)}
							disabled={disabled}
							activeOpacity={0.8}
						>
							<Text
								style={[
									s.dayChipText,
									active && s.dayChipTextActive,
									disabled && s.dayChipTextDisabled,
								]}
							>
								{day.slice(0, 3)}
							</Text>
						</TouchableOpacity>
					);
				})}
			</View>

			<View style={s.startsAtRow}>
				<Text style={s.startsAtLabel}>Starts at</Text>
				{showStartsPicker ? (
					<DateTimePicker
						value={startsAt}
						mode="time"
						display={Platform.OS === "ios" ? "spinner" : "default"}
						onChange={(e, d) => {
							onStartsAtChange(e, d);
							if (Platform.OS === "ios" && e.type === "dismissed") {
								onStartsAtPickerDismiss();
							}
						}}
					/>
				) : (
					<TouchableOpacity
						style={s.startsAtBtn}
						onPress={onOpenStartsPicker}
						activeOpacity={0.8}
					>
						<Text style={s.startsAtText}>{formatTime(startsAt)}</Text>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
}

function Radio({ active }: { active: boolean }) {
	const s = useSStyles();
	return (
		<View style={[s.radioOuter, active && s.radioOuterActive]}>
			{active && <View style={s.radioInner} />}
		</View>
	);
}

function formatDate(date: Date): string {
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function formatTime(date: Date): string {
	return date.toLocaleTimeString(undefined, {
		hour: "numeric",
		minute: "2-digit",
	});
}

function useSStyles() {
	const { colors } = useTheme();
	return useMemo(
		() =>
			StyleSheet.create({
				overlay: {
					flex: 1,
					backgroundColor: "rgba(0,0,0,0.60)",
					justifyContent: "flex-end",
				},
				sheet: {
					backgroundColor: Colors.bgModal,
					borderTopLeftRadius: 24,
					borderTopRightRadius: 24,
					borderTopWidth: 1,
					borderColor: Colors.border,
					maxHeight: "88%",
					paddingBottom: Platform.OS === "ios" ? 36 : 20,
				},
				handle: {
					width: 32,
					height: 3,
					borderRadius: 2,
					backgroundColor: Colors.border,
					alignSelf: "center",
					marginTop: 12,
					marginBottom: 4,
				},
				header: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: 22,
					paddingVertical: 16,
					borderBottomWidth: 1,
					borderBottomColor: Colors.border,
				},
				title: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary },
				closeBtn: {
					width: 28,
					height: 28,
					borderRadius: 14,
					backgroundColor: Colors.bgElevated,
					alignItems: "center",
					justifyContent: "center",
				},
				closeBtnText: { fontSize: 11, color: Colors.textSecondary },
				summaryCard: {
					flexDirection: "row",
					alignItems: "center",
					gap: 10,
					marginHorizontal: 16,
					marginTop: 12,
					marginBottom: 4,
					paddingHorizontal: 14,
					paddingVertical: 11,
				},
				summaryDot: {
					width: 7,
					height: 7,
					borderRadius: 4,
					backgroundColor: Colors.accent,
					flexShrink: 0,
				},
				summaryText: {
					fontSize: 13,
					fontWeight: "600",
					color: Colors.accent,
					flex: 1,
				},
				scrollArea: { flexGrow: 0 },
				scrollContent: {
					paddingHorizontal: 16,
					paddingTop: 14,
					paddingBottom: 8,
					gap: 8,
				},
				sectionLabel: {
					fontSize: 11,
					fontWeight: "700",
					color: Colors.textMuted,
					letterSpacing: 1.1,
					textTransform: "uppercase",
					marginBottom: 4,
					marginLeft: 2,
				},
				pillRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
				pill: {
					paddingHorizontal: 16,
					paddingVertical: 10,
					borderRadius: Radius.md,
					borderWidth: 1,
					borderColor: Colors.border,
					backgroundColor: Colors.bgCard,
				},
				pillActive: {
					borderColor: Colors.accent,
					backgroundColor: Colors.accent + "1A",
				},
				pillText: {
					fontSize: 13,
					fontWeight: "600",
					color: Colors.textSecondary,
				},
				pillTextActive: { color: Colors.accent },
				optionCard: {
					backgroundColor: Colors.bgCard,
					borderRadius: Radius.md,
					borderWidth: 1,
					borderColor: Colors.border,
					overflow: "hidden",
					marginBottom: 4,
				},
				optionCardHeader: {
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: 16,
					paddingVertical: 14,
					gap: 12,
				},
				optionCardLeft: { flex: 1 },
				optionCardTitle: {
					fontSize: 14,
					fontWeight: "600",
					color: Colors.textPrimary,
					marginBottom: 2,
				},
				optionCardSubtitle: { fontSize: 12, color: Colors.textMuted },
				radioOuter: {
					width: 20,
					height: 20,
					borderRadius: 10,
					borderWidth: 2,
					borderColor: Colors.border,
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
				},
				radioOuterActive: { borderColor: Colors.accent },
				radioInner: {
					width: 10,
					height: 10,
					borderRadius: 5,
					backgroundColor: Colors.accent,
				},
				dayRangeWrap: {
					borderTopWidth: 1,
					borderTopColor: Colors.border,
					paddingHorizontal: 16,
					paddingVertical: 14,
					gap: 12,
				},
				dayChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
				dayChip: {
					width: 42,
					height: 42,
					borderRadius: 21,
					borderWidth: 1,
					borderColor: Colors.border,
					backgroundColor: Colors.bgElevated,
					alignItems: "center",
					justifyContent: "center",
				},
				dayChipActive: {
					borderColor: Colors.accent,
					backgroundColor: Colors.accent,
				},
				dayChipDisabled: { opacity: 0.4 },
				dayChipText: {
					fontSize: 12,
					fontWeight: "700",
					color: Colors.textSecondary,
				},
				dayChipTextActive: { color: Colors.white },
				dayChipTextDisabled: { color: Colors.textMuted },
				startsAtRow: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				startsAtLabel: {
					fontSize: 13,
					fontWeight: "600",
					color: Colors.textPrimary,
				},
				startsAtBtn: {
					paddingHorizontal: 14,
					paddingVertical: 8,
					backgroundColor: Colors.bgElevated,
					borderRadius: Radius.md,
					borderWidth: 1,
					borderColor: Colors.accent,
				},
				startsAtText: {
					fontSize: 13,
					fontWeight: "600",
					color: Colors.accent,
				},
				datePickerWrap: {
					borderTopWidth: 1,
					borderTopColor: Colors.border,
					paddingHorizontal: 16,
					paddingVertical: 12,
				},
				changeDateBtn: {
					paddingVertical: 10,
					paddingHorizontal: 14,
					backgroundColor: Colors.bgElevated,
					borderRadius: Radius.md,
					borderWidth: 1,
					borderColor: Colors.accent,
				},
				changeDateText: {
					fontSize: 13,
					fontWeight: "600",
					color: Colors.accent,
				},
				repeatRow: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingHorizontal: 4,
					paddingVertical: 12,
					gap: 12,
				},
				repeatLeft: { flex: 1 },
				repeatTitle: {
					fontSize: 14,
					fontWeight: "600",
					color: Colors.textPrimary,
					marginBottom: 2,
				},
				repeatSubtitle: { fontSize: 12, color: Colors.textMuted },
				actions: {
					flexDirection: "row",
					gap: 10,
					paddingHorizontal: 16,
					paddingTop: 14,
				},
				cancelBtn: {
					flex: 1,
					backgroundColor: Colors.bgElevated,
					borderRadius: Radius.lg,
					paddingVertical: 15,
					alignItems: "center",
					borderWidth: 1,
					borderColor: Colors.border,
				},
				cancelText: {
					fontSize: 15,
					fontWeight: "600",
					color: Colors.textSecondary,
				},
				confirmBtn: {
					flex: 2,
					backgroundColor: Colors.accent,
					borderRadius: Radius.lg,
					paddingVertical: 15,
					alignItems: "center",
					justifyContent: "center",
					...Shadow.accent,
				},
				confirmBtnDisabled: {
					backgroundColor: Colors.bgElevated,
					shadowOpacity: 0,
					elevation: 0,
				},
				confirmText: { fontSize: 15, fontWeight: "700", color: Colors.white },
				confirmTextDisabled: { color: Colors.textMuted },
			}),
		[colors],
	);
}
