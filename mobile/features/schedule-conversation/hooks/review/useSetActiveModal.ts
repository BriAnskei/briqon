import { useState, useMemo, useEffect } from "react";
import { Platform } from "react-native";
import {
  DateMode,
  buildSummary,
  calculateActiveDays,
} from "../../util/reviewHelpers";
import { useSchedule } from "@/context/ScheduleContext";
import { CreateActiveSchedule } from "@/src/models/active_schedule.model";
import { CreateSchedule } from "@/src/models/schedule.model";
import { ActiveScheduleService } from "@/src/service/active-schedule.service";

let activeScheduleServiceInstance: ActiveScheduleService | null = null;

interface UseSetActiveModalOptions {
  onClose: () => void;
  onConfirm: (
    activeSchedule: CreateActiveSchedule,
    schedule: CreateSchedule,
  ) => void;
  setIsSchedActivatedModalOpen: (n: boolean) => void;
}

/** Returns today's index in Monday-based order (0=Mon … 6=Sun) */
function todayDayIndex(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

/** Strips time from a date, returning midnight of that date */
function toMidnight(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

// Remap to Mon-based order: Mon=0, Tue=1...Sat=5, Sun=6
const toMonBased = (jsDay: number) => (jsDay === 0 ? 6 : jsDay - 1);

/**
 * Returns day indices that are strictly BEFORE starts_at's weekday.
 * Expected indices are Monday-based: 0=Mon … 6=Sun.
 */
function computeDisabledDays(startsAt: Date): number[] {
  const pivotDay = startsAt.getDay(); // 0=Sun … 6=Sat

  const pivotMon = toMonBased(pivotDay);
  const disabled: number[] = [];

  for (let i = 0; i < 7; i++) {
    // disable days that come before pivot in Mon-based order
    if (i < pivotMon) {
      disabled.push(i); // push Mon-based index directly
    }
  }

  return disabled;
}

/**
 * Given selectedDays (Monday-based indices) and a starts_at date,
 * returns the actual Date objects for start and end within that week.
 * The week is anchored to the Monday of the week that contains starts_at.
 */
function datesForSelectedDays(
  selectedDays: number[],
  startsAt: Date,
): { firstDate: Date; lastDate: Date } | null {
  if (selectedDays.length === 0) return null;

  const sorted = [...selectedDays].sort((a, b) => a - b);
  const startsAtMidnight = toMidnight(startsAt);
  const pivotDay = startsAtMidnight.getDay(); // JS day of starts_at

  const pivotMon = toMonBased(pivotDay);

  const toDate = (monDay: number): Date => {
    const diff = monDay - pivotMon;
    const d = new Date(startsAtMidnight);
    d.setDate(d.getDate() + diff);
    return d;
  };

  return {
    firstDate: toDate(sorted[0]),
    lastDate: toDate(sorted[sorted.length - 1]),
  };
}

export function useSetActiveModal({
  onClose,
  onConfirm,
  setIsSchedActivatedModalOpen,
}: UseSetActiveModalOptions) {
  if (!activeScheduleServiceInstance)
    activeScheduleServiceInstance = new ActiveScheduleService();

  const { selectedReviewItems } = useSchedule();

  // Default to "today" with today's day pre-selected
  const [dateMode, setDateMode] = useState<DateMode>("today");
  const [recurring, setRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([todayDayIndex()]);
  const [specificDate, setSpecificDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Day range starts_at picker state
  const [rangeStartsAt, setRangeStartsAt] = useState<Date>(
    toMidnight(new Date()),
  );
  const [showRangeStartsPicker, setShowRangeStartsPicker] = useState(false);

  const [saveSchedule, setSaveSchedule] = useState(false);
  const [scheduleName, setScheduleName] = useState("");

  useEffect(() => {
    console.log("specific date update: ", specificDate);
  }, [specificDate]);

  // Compute disabled days based on rangeStartsAt
  const disabledDays = useMemo(
    () => computeDisabledDays(rangeStartsAt),
    [rangeStartsAt],
  );

  const canConfirm =
    dateMode !== null &&
    !isSubmitting &&
    (dateMode !== "range" || selectedDays.length > 0);

  const summary = buildSummary(dateMode, recurring, selectedDays, specificDate);

  const handleModeSelect = (mode: DateMode) => {
    const next = dateMode === mode ? null : mode;
    setDateMode(next);

    if (next === "today") {
      setSelectedDays([todayDayIndex()]);
      setShowDatePicker(false);
    } else if (next === "tomorrow") {
      const tomorrow = (todayDayIndex() + 1) % 7;
      setSelectedDays([tomorrow]);
      setShowDatePicker(false);
    } else if (next === "range") {
      setSelectedDays([]);
      setShowDatePicker(false);
    } else if (next === "specific") {
      setSelectedDays([]);
      setShowDatePicker(true);
      setRecurring(false); // specific date never repeats
    } else {
      // deselected
      setSelectedDays([]);
      setShowDatePicker(false);
    }
  };

  const toggleDay = (day: number) => {
    if (disabledDays.includes(day)) return;
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleDateChange = (_: unknown, date?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (date) setSpecificDate(date);
  };

  const handleRangeStartsAtChange = (date: Date) => {
    setRangeStartsAt(toMidnight(date));
    // Auto-clear selected days since disabled set may change
    setSelectedDays([]);
  };

  const handleClose = () => {
    setDateMode("today");
    setRecurring(false);
    setShowDatePicker(false);
    setSelectedDays([todayDayIndex()]);
    setSpecificDate(new Date());
    setRangeStartsAt(toMidnight(new Date()));
    setShowRangeStartsPicker(false);
    setSaveSchedule(false);
    setScheduleName("");
    onClose();
  };

  // ── active_type ─────────────────────────────────────────────────────────────
  const getActiveScheduleType = (): "days" | "date" => {
    if (dateMode === "range") return "days";
    // today/tomorrow: if recurring → treat as "days" (weekly by day)
    if ((dateMode === "today" || dateMode === "tomorrow") && recurring)
      return "days";
    return "date";
  };

  // ── starts_at / ends_at ──────────────────────────────────────────────────────
  const buildDateRange = ():
    | { starts_at: Date | null; ends_at: Date | null }
    | undefined => {
    if (!dateMode) return undefined;

    // Recurring always means no boundary dates
    if (recurring) return { starts_at: null, ends_at: null };

    if (dateMode === "specific") {
      const d = toMidnight(specificDate);
      return { starts_at: d, ends_at: d };
    }

    if (dateMode === "today") {
      const d = toMidnight(new Date());
      return { starts_at: d, ends_at: d };
    }

    if (dateMode === "tomorrow") {
      const d = toMidnight(new Date());
      d.setDate(d.getDate() + 1);
      return { starts_at: d, ends_at: d };
    }

    if (dateMode === "range") {
      const result = datesForSelectedDays(selectedDays, rangeStartsAt);
      if (!result) return { starts_at: rangeStartsAt, ends_at: rangeStartsAt };
      return { starts_at: result.firstDate, ends_at: result.lastDate };
    }

    return undefined;
  };

  // ── confirm ──────────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!canConfirm || !dateMode) return;
    setIsSubmitting(true);

    try {
      const days = calculateActiveDays(dateMode, selectedDays);
      const dateRange = buildDateRange();

      const selectedDate = specificDate;

      //  active_days: days,
      const activeSchedule: CreateActiveSchedule = {
        recurring,
        active_type: getActiveScheduleType(),
        starts_at: dateRange?.starts_at ?? undefined,
        ends_at: dateRange?.ends_at ?? undefined,
      };

      const schedule: CreateSchedule = {
        name: saveSchedule ? scheduleName.trim() : "",
        schedule_list: selectedReviewItems,
        temporary: !saveSchedule,
      };

      activeScheduleServiceInstance?.createActiveSchedule({
        activeSchedule,
        schedule,
        dayOfWeeks: days,
        date: specificDate,
      });

      // onConfirm(testactive, testschedule);
      setIsSchedActivatedModalOpen(true);
    } catch (error) {
      console.error("[useSetActiveModal] Confirm failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // mode / selection
    dateMode,
    recurring,
    selectedDays,
    specificDate,
    showDatePicker,
    disabledDays,
    rangeStartsAt,
    showRangeStartsPicker,
    // derived
    canConfirm,
    isSubmitting,
    summary,
    // setters
    setRecurring,
    toggleDay,
    setShowDatePicker,
    setShowRangeStartsPicker,
    handleModeSelect,
    handleDateChange,
    handleRangeStartsAtChange,
    handleClose,
    handleConfirm,
    // save schedule
    saveSchedule,
    setSaveSchedule,
    scheduleName,
    setScheduleName,
  };
}
