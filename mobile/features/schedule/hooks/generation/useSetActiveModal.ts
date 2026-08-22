import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";
import useModal from "@/hooks/useModal";
import { activeScheduleService } from "@/src/composition/activationServiceComposition";
import {
  type ScheduleConflict,
  ScheduleConflictError,
} from "@/src/errors/scheduleActivationConflic.error";
import type { CreateActivationInput } from "@/type/ui/schedule/activation.types";
import {
  addDays,
  formatCompact,
  isSameDay,
  resolveRangeEnd,
  resolveRangeStart,
  startOfDay,
  timeToMinutes,
} from "@/utils/TimeFormatter";
import type { ScheduleItem } from "../../../../src/models/schedule.model";
import type { GenerationResult } from "../../utils/scheduleResponseParser";

export type DateMode = "today" | "tomorrow" | "range" | "specific" | null;

export const DAYS = [
  "Sunday", // index 0
  "Monday", // index 1
  "Tuesday", // index 2
  "Wednesday", // index 3
  "Thursday", // index 4
  "Friday", // index 5
  "Saturday", // index 6
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
  summary: string;
  isConfirmBlocked: boolean;
  isTodayAvailable: boolean;
  setRecurring: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDatePicker: React.Dispatch<React.SetStateAction<boolean>>;
  setShowRangeDatePicker: React.Dispatch<React.SetStateAction<boolean>>;
  handleModeSelect: (mode: Exclude<DateMode, null>) => void;
  toggleDay: (day: string) => void;
  handleDateChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  handleRangeDateChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  handleClose: () => void;
  handleConfirm: () => Promise<void>;
  buildPayload: () => CreateActivationInput;
  isOpen: boolean;
  open: () => void;

  resetState: () => void;

  // ── conflict resolution ──────────────────────────────────────────────
  conflicts: ScheduleConflict[];
  isConflictModalOpen: boolean;
  isResolvingConflict: boolean;
  handleCancelConflicts: () => void;
  handleResolveConflicts: () => Promise<void>;
  activationDayIndices: number[];
  /**
   * Time-of-day window (minutes since midnight) that THIS activation
   * attempt would occupy — derived from scheduleTimeBounds, which the
   * factory uses unconditionally for both "days" and "date" activeType.
   * Used by the conflict modal to compute, per conflicting schedule,
   * the actual overlapping time range rather than the full existing
   * schedule's window.
   */
  activationWindowStartMin: number | null;
  activationWindowEndMin: number | null;
}

export function useSetActiveModal(payload: {
  result: GenerationResult | null;
  generatedScheduleId?: string;
  scheduleItems: ScheduleItem[];
  setIsScheduleSavedByActivation: (b: boolean) => void;
  isScheduleSavedDirectly: boolean;
  isScheduleSavedByActivation: boolean;
}): UseSetActiveModalState {
  const {
    result,
    generatedScheduleId,
    scheduleItems,
    setIsScheduleSavedByActivation,
    isScheduleSavedByActivation,
    isScheduleSavedDirectly,
  } = payload;
  const { isOpen, open, close } = useModal();

  const service = activeScheduleService;

  const [dateMode, setDateMode] = useState<DateMode>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [rangeAnchorDate, setRangeAnchorDate] = useState<Date>(new Date());
  const [showRangeDatePicker, setShowRangeDatePicker] = useState(false);
  const [specificDate, setSpecificDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── conflict resolution state ──────────────────────────────────────────
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);

  const isScheduleNeedsToSave = !isScheduleSavedDirectly && !isScheduleSavedByActivation;

  const resetState = useCallback(() => {
    setDateMode(null);
    setSelectedDays([]);
    setRangeAnchorDate(new Date());
    setShowRangeDatePicker(false);
    setSpecificDate(new Date());
    setShowDatePicker(false);
    setRecurring(false);
    setIsSubmitting(false);
    // clear any stale conflict state from a previous activation attempt
    setConflicts([]);
    setIsConflictModalOpen(false);
    setIsResolvingConflict(false);
  }, []);

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

  const isTodayAvailable = useMemo(() => {
    const firstItem = result?.schedule?.[0];
    if (!firstItem) return false;

    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const startMinutes = timeToMinutes(firstItem.start_time);

    return startMinutes > nowMinutes;
  }, [result]);

  useEffect(() => {
    if (dateMode === "today" && !isTodayAvailable) {
      setDateMode(null);
    }
  }, [dateMode, isTodayAvailable]);

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

  const rangeResolvedStart = useMemo(
    () => resolveRangeStart(rangeAnchorDate, selectedDayIndices),
    [rangeAnchorDate, selectedDayIndices],
  );

  const rangeResolvedEnd = useMemo(
    () => resolveRangeEnd(rangeResolvedStart, selectedDayIndices),
    [rangeResolvedStart, selectedDayIndices],
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

  /**
   * Earliest start_time and latest end_time across all schedule items,
   * in "HH:MM" format. Computed from scheduleItems so the activation
   * window spans the full generated schedule.
   */
  const scheduleTimeBounds = useMemo(() => {
    if (scheduleItems.length === 0) return null;

    return {
      scheduleTimeStart: scheduleItems[0].start_time,
      sheduleTimeEnd: scheduleItems[scheduleItems.length - 1].end_time,
    };
  }, [scheduleItems]);

  /**
   * scheduleTimeBounds as minutes-since-midnight. This is the actual
   * time-of-day window ActivationFactory uses for every activeType
   * ("days" recurring/non-recurring and "date"), so it's the correct
   * value to intersect against a conflicting schedule's own window when
   * showing "what part of this actually conflicts" in the conflict modal.
   */
  const activationWindowStartMin = useMemo(
    () =>
      scheduleTimeBounds ? timeToMinutes(scheduleTimeBounds.scheduleTimeStart) : null,
    [scheduleTimeBounds],
  );

  const activationWindowEndMin = useMemo(
    () => (scheduleTimeBounds ? timeToMinutes(scheduleTimeBounds.sheduleTimeEnd) : null),
    [scheduleTimeBounds],
  );

  const buildPayload = useCallback((): CreateActivationInput => {
    if (!generatedScheduleId) throw new Error("No generatedScheduleId");

    if (!scheduleTimeBounds) throw new Error("No bounds detected");

    if (isScheduleNeedsToSave && scheduleItems.length === 0)
      throw new Error("No scheduleItem to save`");

    let activeType: "days" | "date";
    let selectedDayIndices: number[] | undefined;
    let selectedDate: Date | undefined;
    let nonReccuringDaysTypeStartsAt: Date | undefined;

    if (dateMode === "specific") {
      activeType = "date";
      const date = startOfDay(specificDate);
      selectedDate = date;
      // For date type, the activation starts at the selected date itself
      nonReccuringDaysTypeStartsAt = date;
    } else {
      activeType = "days";

      let dayIndices: number[] = [];
      const today = new Date();

      if (dateMode === "today") {
        dayIndices = [todayWeekdayIndex];
        if (!recurring) {
          const date = startOfDay(today);
          nonReccuringDaysTypeStartsAt = date;
        }
      } else if (dateMode === "tomorrow") {
        const tomorrowIdx = (todayWeekdayIndex + 1) % 7;
        dayIndices = [tomorrowIdx];
        if (!recurring) {
          const date = startOfDay(addDays(today, 1));
          nonReccuringDaysTypeStartsAt = date;
        }
      } else if (dateMode === "range") {
        dayIndices = selectedDays.map((day) => DAYS.indexOf(day)).sort((a, b) => a - b);

        // For non-recurring day selections, the start is the first selected
        // day on or after the anchor date (e.g. anchor=21, selected Sun/Mon
        // → startsAt = 22, the first selected day at/after the anchor)
        if (!recurring && dayIndices.length > 0 && rangeResolvedStart) {
          nonReccuringDaysTypeStartsAt = rangeResolvedStart;
        }
      }

      selectedDayIndices = dayIndices.length > 0 ? dayIndices : undefined;
    }

    return {
      scheduleId: generatedScheduleId,
      activeType,
      recurring,
      selectedDays: selectedDayIndices,
      selectedDate,
      overwrite: false,
      nonReccuringDaysTypeStartsAt,
      scheduleTimeStart: scheduleTimeBounds.scheduleTimeStart,
      sheduleTimeEnd: scheduleTimeBounds.sheduleTimeEnd,
      // When the schedule has not yet been persisted, include the schedule
      // data so the activation domain can save it as temporary (temporary=true)
      // before creating the activation record.
      ...(isScheduleNeedsToSave &&
        scheduleItems.length > 0 && {
          scheduleItems,
          summaries: result?.summary ?? [],
          subSummaries: result?.subSummary ?? [],
        }),
    };
  }, [
    dateMode,
    recurring,
    selectedDays,
    specificDate,
    generatedScheduleId,
    todayWeekdayIndex,
    rangeResolvedStart,
    scheduleItems,
    result,
    isScheduleNeedsToSave,
    scheduleTimeBounds,
  ]);

  const handleConfirm = useCallback(async () => {
    if (isConfirmBlocked) return;

    const input = buildPayload();
    setIsSubmitting(true);

    try {
      await service.createAsync(input);

      if (isScheduleNeedsToSave) {
        setIsScheduleSavedByActivation(true);
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Schedule has been set as active",
        position: "top",
      });

      resetState();
      close();
    } catch (err) {
      console.log(err);
      if (err instanceof ScheduleConflictError) {
        // err.context carries the ScheduleConflict[] payload (see BaseError)
        setConflicts(err.context);
        setIsConflictModalOpen(true);
      }
      // Any other error: conflict modal stays closed; SetActiveModal
      // remains open so the user can retry.
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isConfirmBlocked,
    buildPayload,
    isScheduleNeedsToSave,
    setIsScheduleSavedByActivation,
    resetState,
    close,
  ]);

  // ── conflict resolution handlers ────────────────────────────────────────

  // ── weekday footprint of the activation currently being created ────────
  // Used by the conflict modal to compute, per conflicting schedule, which
  // specific weekdays actually overlap with THIS activation attempt.
  const activationDayIndices = useMemo(() => {
    if (dateMode === "specific") return [specificDate.getDay()];
    if (dateMode === "today") return [todayWeekdayIndex];
    if (dateMode === "tomorrow") return [(todayWeekdayIndex + 1) % 7];
    if (dateMode === "range") return selectedDayIndices;
    return [];
  }, [dateMode, specificDate, todayWeekdayIndex, selectedDayIndices]);

  const handleCancelConflicts = useCallback(() => {
    setConflicts([]);
    setIsConflictModalOpen(false);
  }, []);

  const handleResolveConflicts = useCallback(async () => {
    if (conflicts.length === 0) return;

    setIsResolvingConflict(true);
    try {
      // TODO: apply the reorder/drop resolution against `conflicts`,
      // then retry activation with overwrite enabled

      const input = { ...buildPayload(), overwrite: true };
      await service.createAsync(input);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Schedule has been set as active",
        position: "top",
      });

      setConflicts([]);
      setIsConflictModalOpen(false);
      resetState();
      close();
    } catch (err) {
      console.log("Conflict resolution failed", err);
    } finally {
      setIsResolvingConflict(false);
    }
  }, [conflicts, buildPayload, resetState, close]);

  return {
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
    summary,
    isConfirmBlocked,
    isTodayAvailable,

    resetState,

    setRecurring,
    setShowDatePicker,
    setShowRangeDatePicker,
    handleModeSelect,
    toggleDay,
    handleDateChange,
    handleRangeDateChange,
    handleClose,
    handleConfirm,

    buildPayload,

    isOpen,
    open,

    conflicts,
    isConflictModalOpen,
    isResolvingConflict,
    handleCancelConflicts,
    handleResolveConflicts,
    activationDayIndices,
    activationWindowStartMin,
    activationWindowEndMin,
  };
}
