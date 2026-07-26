import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { useNewScheduleForm } from "@/context/NewScheduleFormContext";
import useModal from "@/hooks/useModal";
import { ScheduleConflictError } from "@/src/errors/scheduleActivationConflic.error";
import type { ActiveSchedule } from "@/src/models/activeSchedule.model";
import {
	ActiveScheduleService,
	type CreationPayload,
} from "@/src/service/activeSchedule.service";
import {
	addDays,
	formatCompact,
	isSameDay,
	resolveRangeEnd,
	resolveRangeStart,
	startOfDay,
	timeToMinutes,
	toLocalISODate,
} from "@/utils/TimeFormatter";

export type DateMode = "today" | "tomorrow" | "range" | "specific" | null;

export const DAYS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

export interface UseSetActiveModalState {
	dateMode: DateMode;
	selectedDays: string[];
	disabledDays: string[];
	specificDate: Date;
	showDatePicker: boolean;
	rangeAnchorDate: Date;
	showRangeDatePicker: boolean;
	rangeResolvedStart: Date | null;
	rangeResolvedEnd: Date | null;
	recurring: boolean;
	isSubmitting: boolean;
	error: unknown;
	summary: string;
	isConfirmBlocked: boolean;
	isTodayAvailable: boolean;
	setRecurring: React.Dispatch<React.SetStateAction<boolean>>;
	setShowDatePicker: React.Dispatch<React.SetStateAction<boolean>>;
	setShowRangeDatePicker: React.Dispatch<React.SetStateAction<boolean>>;
	handleModeSelect: (mode: Exclude<DateMode, null>) => void;
	toggleDay: (day: string) => void;
	handleDateChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
	handleRangeDateChange: (
		event: DateTimePickerEvent,
		selectedDate?: Date,
	) => void;
	handleClose: () => void;
	handleConfirm: () => Promise<void>;
	buildPayload: () => CreationPayload;
	isOpen: boolean;
	open: () => void;
}

export function useSetActiveModal(): UseSetActiveModalState {
	const { isOpen, open, close } = useModal();

	const service = useMemo(() => new ActiveScheduleService(), []);

	const { result, generatedScheduleId } = useNewScheduleForm();

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

	const disabledDays = useMemo(() => {
		if (!recurring && !rangeAnchorDate) return DAYS;
		return [];
	}, [recurring, rangeAnchorDate]);

	const toggleDay = useCallback(
		(day: string) => {
			if (disabledDays.includes(day)) return;

			setSelectedDays((prev) => {
				const isAdding = !prev.includes(day);
				const next = isAdding ? [...prev, day] : prev.filter((d) => d !== day);

				// First day picked for a non-recurring range: snap the
				// "Starts From" anchor to the resolved start for that day,
				// so the field reflects what will actually be submitted
				// (e.g. anchor Jul 26 + pick "Tue" -> anchor jumps to Jul 28).
				// Re-arms any time the list goes back to empty and a new
				// first day is picked.
				if (!recurring && isAdding && prev.length === 0) {
					const dayIndex = DAYS.indexOf(day);
					const snappedStart = resolveRangeStart(rangeAnchorDate, [dayIndex]);
					if (snappedStart) {
						setRangeAnchorDate(snappedStart);
					}
				}

				return next;
			});
		},
		[disabledDays, recurring, rangeAnchorDate],
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

				setSelectedDays([]);
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

		return false;
	}, [isSubmitting, dateMode, selectedDays]);

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
		// setIsSubmitting(true);
		setError(null);

		try {
			console.log("payload stringified: ", JSON.stringify(payload, null, 2));
			console.log(toLocalISODate(payload.newActiveSchedule.starts_at));
			console.log(toLocalISODate(payload.newActiveSchedule.ends_at));

			await service.createAsync(payload);

			// resetState();
			// close();
		} catch (err) {
			if (err instanceof ScheduleConflictError)
				console.log("Conflict Error", err);

			// Surface ScheduleConflictError (or any other failure) back to the
			// caller instead of closing the modal. Conflict-resolution UI is
			// wired up separately.
			setError(err);
			setIsSubmitting(false);
		}
	}, [isConfirmBlocked, buildPayload, service]);

	return {
		// state
		dateMode,
		selectedDays,
		disabledDays,
		specificDate,
		showDatePicker,
		rangeAnchorDate,
		showRangeDatePicker,
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

		isOpen,
		open,
	};
}
