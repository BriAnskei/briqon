import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { useAI } from "@/context/AIContext";
import type { ActiveSchedule } from "@/src/models/activeSchedule.model";
import { timeToMinutes } from "@/utils/TimeFormatter";

export type DateMode = "today" | "tomorrow" | "range" | "specific" | null;

export type CreationPayload = {
	newActiveSchedule: ActiveSchedule;
	selectedDays?: number[];
	selectedDate?: Date;
};

export const DAYS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

// ── date helpers ─────────────────────────────────────────────────────────

function startOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

function addDays(date: Date, days: number): Date {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

/** First date on/after `anchor` (inclusive) whose weekday is one of
 * `selectedIndices`. Scans a 7-day window, so it always finds a match
 * as long as at least one weekday is selected. */
function resolveRangeStart(
	anchor: Date,
	selectedIndices: number[],
): Date | null {
	if (selectedIndices.length === 0) return null;
	const anchorDay = startOfDay(anchor);
	for (let offset = 0; offset < 7; offset++) {
		const candidate = addDays(anchorDay, offset);
		if (selectedIndices.includes(candidate.getDay())) return candidate;
	}
	return null;
}

/** Last date within the 7-day window starting at `start` (inclusive) whose
 * weekday is one of `selectedIndices` — i.e. the final occurrence of the
 * selected days before the pattern would repeat. */
function resolveRangeEnd(
	start: Date | null,
	selectedIndices: number[],
): Date | null {
	if (!start || selectedIndices.length === 0) return null;
	for (let offset = 6; offset >= 0; offset--) {
		const candidate = addDays(start, offset);
		if (selectedIndices.includes(candidate.getDay())) return candidate;
	}
	return start;
}

function formatCompact(date: Date): string {
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
}

function isSameDay(a: Date, b: Date): boolean {
	return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export interface UseSetActiveModalParams {
	isOpen: boolean;
	close: () => void;
}

export function useSetActiveModal({ isOpen, close }: UseSetActiveModalParams) {
	const { result, generatedScheduleId } = useAI();

	const [dateMode, setDateMode] = useState<DateMode>(null);

	// "range" (days of week) state
	const [selectedDays, setSelectedDays] = useState<string[]>([]);

	// "range" + non-recurring: anchor date the user picks the active start from.
	// The actual starts_at is resolved forward from this to the nearest
	// selected weekday (see resolveRangeStart). Defaults to today for display
	// purposes, but `hasConfirmedStartDate` tracks whether the user has
	// actually confirmed a value via the picker — until they have, day
	// chips stay disabled (see `disabledDays`).
	const [rangeAnchorDate, setRangeAnchorDate] = useState<Date>(new Date());
	const [showRangeDatePicker, setShowRangeDatePicker] = useState(false);
	const [hasConfirmedStartDate, setHasConfirmedStartDate] = useState(false);

	// "specific" date state
	const [specificDate, setSpecificDate] = useState<Date>(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);

	const [recurring, setRecurring] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<unknown>(null);

	const resetState = useCallback(() => {
		setDateMode(null);
		setSelectedDays([]);
		setRangeAnchorDate(new Date());
		setShowRangeDatePicker(false);
		setHasConfirmedStartDate(false);
		setSpecificDate(new Date());
		setShowDatePicker(false);
		setRecurring(false);
		setIsSubmitting(false);
		setError(null);
	}, []);

	// Reset whenever the modal is (re)opened, so stale selections from a
	// previous activation attempt never leak into a new session.
	useEffect(() => {
		if (isOpen) {
			resetState();
		}
	}, [isOpen, resetState]);

	const handleClose = useCallback(() => {
		resetState();
		close();
	}, [resetState, close]);

	const handleModeSelect = useCallback((mode: Exclude<DateMode, null>) => {
		setDateMode(mode);
		setShowDatePicker(mode === "specific");
	}, []);

	// ── today's weekday index (still used for "today"/"tomorrow" quick
	// picks in buildPayload — no longer drives day-chip disabling) ─────────

	const todayWeekdayIndex = useMemo(() => new Date().getDay(), []);

	/** Day-chip disabling rule for "Select Days":
	 *  - recurring       → nothing disabled, any day selectable.
	 *  - non-recurring +
	 *    no confirmed
	 *    start date yet  → everything disabled (must pick a start date first).
	 *  - non-recurring +
	 *    start date
	 *    confirmed       → nothing disabled (resolveRangeStart/End loop
	 *                      forward from the anchor regardless of which
	 *                      weekday it lands on). */
	const disabledDays = useMemo(() => {
		if (recurring) return [];
		if (!hasConfirmedStartDate) return DAYS;
		return [];
	}, [recurring, hasConfirmedStartDate]);

	const toggleDay = useCallback(
		(day: string) => {
			if (disabledDays.includes(day)) return;
			setSelectedDays((prev) =>
				prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
			);
		},
		[disabledDays],
	);

	// ── "today" availability ────────────────────────────────────────────────

	/** Today is only offered if the generated schedule's first item hasn't
	 * started yet relative to right now. */
	const isTodayAvailable = useMemo(() => {
		const firstItem = result?.schedule?.[0];
		if (!firstItem) return false;

		const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
		const startMinutes = timeToMinutes(firstItem.start_time);

		return startMinutes > nowMinutes;
	}, [result]);

	// If "today" becomes unavailable (e.g. time ticks past) while it's the
	// active selection, fall back out of it.
	useEffect(() => {
		if (dateMode === "today" && !isTodayAvailable) {
			setDateMode(null);
		}
	}, [dateMode, isTodayAvailable]);

	// ── specific date picker ────────────────────────────────────────────────

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

	// ── range start date picker (non-recurring "Select Days") ──────────────

	const handleRangeDateChange = useCallback(
		(event: DateTimePickerEvent, selectedDate?: Date) => {
			if (Platform.OS === "android") {
				setShowRangeDatePicker(false);
			}
			if (event.type === "set" && selectedDate) {
				setRangeAnchorDate(selectedDate);
				setHasConfirmedStartDate(true);
			}
		},
		[],
	);

	const selectedDayIndices = useMemo(
		() => selectedDays.map((day) => DAYS.indexOf(day)),
		[selectedDays],
	);

	/** Resolved active window for "range" + non-recurring. Undefined/null
	 * when there's nothing to resolve yet (no days selected). */
	const rangeResolvedStart = useMemo(
		() => resolveRangeStart(rangeAnchorDate, selectedDayIndices),
		[rangeAnchorDate, selectedDayIndices],
	);

	const rangeResolvedEnd = useMemo(
		() => resolveRangeEnd(rangeResolvedStart, selectedDayIndices),
		[rangeResolvedStart, selectedDayIndices],
	);

	// ── confirm gating ──────────────────────────────────────────────────────

	const isConfirmBlocked = useMemo(() => {
		if (isSubmitting) return true;
		if (dateMode === null) return true;
		if (dateMode === "range" && selectedDays.length === 0) return true;
		if (dateMode === "range" && !recurring && !hasConfirmedStartDate)
			return true;
		return false;
	}, [isSubmitting, dateMode, selectedDays, recurring, hasConfirmedStartDate]);

	// ── summary text ────────────────────────────────────────────────────────

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

			if (recurring) {
				return `${dayList} · repeats weekly`;
			}

			if (rangeResolvedStart && rangeResolvedEnd) {
				const dateLabel = isSameDay(rangeResolvedStart, rangeResolvedEnd)
					? formatCompact(rangeResolvedStart)
					: `${formatCompact(rangeResolvedStart)} – ${formatCompact(rangeResolvedEnd)}`;
				return `${dayList} · ${dateLabel}`;
			}

			return dayList;
		}
		if (dateMode === "specific") {
			return `Active on ${specificDate.toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
				year: "numeric",
			})}`;
		}
		return "";
	}, [
		dateMode,
		recurring,
		selectedDays,
		specificDate,
		rangeResolvedStart,
		rangeResolvedEnd,
	]);

	// ── payload construction ────────────────────────────────────────────────

	const buildPayload = useCallback((): CreationPayload => {
		if (!generatedScheduleId) throw new Error("No generatedScheduleId");
		const today = new Date();

		if (dateMode === "specific") {
			const date = startOfDay(specificDate);
			const newActiveSchedule: ActiveSchedule = {
				id: "" as never, // populated server-side / stripped by CreateActiveScheduleEntitySchema
				schedule_id: generatedScheduleId,
				active_type: "date",
				recurring: false,
				starts_at: date,
				ends_at: date,
			};
			return {
				newActiveSchedule,
				selectedDate: date,
			};
		}

		// "today" | "tomorrow" | "range" all resolve to active_type "days"
		let dayIndices: number[] = [];
		let startsAt: Date | undefined;
		let endsAt: Date | undefined;

		if (dateMode === "today") {
			dayIndices = [todayWeekdayIndex];
			if (!recurring) {
				const date = startOfDay(today);
				startsAt = date;
				endsAt = date;
			}
		} else if (dateMode === "tomorrow") {
			const tomorrowIdx = (todayWeekdayIndex + 1) % 7;
			dayIndices = [tomorrowIdx];
			if (!recurring) {
				const date = startOfDay(addDays(today, 1));
				startsAt = date;
				endsAt = date;
			}
		} else if (dateMode === "range") {
			dayIndices = selectedDays
				.map((day) => DAYS.indexOf(day))
				.sort((a, b) => a - b);

			if (
				!recurring &&
				dayIndices.length > 0 &&
				rangeResolvedStart &&
				rangeResolvedEnd
			) {
				startsAt = rangeResolvedStart;
				endsAt = rangeResolvedEnd;
			}
		}

		const newActiveSchedule: ActiveSchedule = {
			id: "" as never,
			schedule_id: generatedScheduleId,
			active_type: "days",
			recurring,
			starts_at: startsAt,
			ends_at: endsAt,
		};

		return {
			newActiveSchedule,
			selectedDays: dayIndices,
		};
	}, [
		dateMode,
		recurring,
		selectedDays,
		specificDate,
		generatedScheduleId,
		todayWeekdayIndex,
		rangeResolvedStart,
		rangeResolvedEnd,
	]);

	const handleConfirm = useCallback(async () => {
		if (isConfirmBlocked) return;

		const payload = buildPayload();
		setIsSubmitting(true);
		setError(null);

		try {
			console.log("payload: ", payload);

			resetState();
			close();
		} catch (err) {
			// Surface ScheduleConflictError (or any other failure) back to the
			// caller instead of closing the modal. Conflict-resolution UI is
			// wired up separately.
			setError(err);
			setIsSubmitting(false);
		}
	}, [isConfirmBlocked, buildPayload, resetState, close]);

	return {
		// state
		dateMode,
		selectedDays,
		disabledDays,
		specificDate,
		showDatePicker,
		rangeAnchorDate,
		showRangeDatePicker,
		hasConfirmedStartDate,
		rangeResolvedStart,
		rangeResolvedEnd,
		recurring,
		isSubmitting,
		error,
		summary,
		isConfirmBlocked,
		isTodayAvailable,

		// setters / handlers
		setRecurring,
		setShowDatePicker,
		setShowRangeDatePicker,
		handleModeSelect,
		toggleDay,
		handleDateChange,
		handleRangeDateChange,
		handleClose,
		handleConfirm,

		// exposed for advanced use (e.g. conflict modal retry with overwrite)
		buildPayload,
	};
}
