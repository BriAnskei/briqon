import { useState } from "react";
import { Platform } from "react-native";
import {
  DateMode,
  buildSummary,
  calculateActiveDays,
} from "../../util/reviewHelpers";
import { useSchedule } from "@/context/ScheduleContext";
import { CreateActiveSchedule } from "@/src/models/active_schedule.model";
import { CreateSchedule } from "@/src/models/schedule.model";

interface UseSetActiveModalOptions {
  onClose: () => void;
  onConfirm: (
    activeSchedule: CreateActiveSchedule,
    schedule: CreateSchedule,
  ) => void;

  setIsSchedActivatedModalOpen: (n: boolean) => void;
}

export function useSetActiveModal({
  onClose,
  onConfirm,
  setIsSchedActivatedModalOpen,
}: UseSetActiveModalOptions) {
  const { selectedReviewItems } = useSchedule();

  const [dateMode, setDateMode] = useState<DateMode>(null);
  const [recurring, setRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [specificDate, setSpecificDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [saveSchedule, setSaveSchedule] = useState(false);
  const [scheduleName, setScheduleName] = useState("");

  const canConfirm =
    dateMode !== null &&
    !isSubmitting &&
    (dateMode !== "range" || selectedDays.length > 0);

  const summary = buildSummary(dateMode, recurring, selectedDays, specificDate);

  const handleModeSelect = (mode: DateMode) => {
    setDateMode((prev) => (prev === mode ? null : mode));
    if (mode !== "range") setSelectedDays([]);
    setShowDatePicker(mode === "specific");
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleDateChange = (_: unknown, date?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (date) setSpecificDate(date);
  };

  const handleClose = () => {
    setDateMode(null);
    setRecurring(false);
    setShowDatePicker(false);
    setSelectedDays([]);
    setSpecificDate(new Date());
    setSaveSchedule(false);
    setScheduleName("");
    onClose();
  };

  const handleConfirm = async () => {
    if (!canConfirm || !dateMode) return;

    setIsSubmitting(true);

    try {
      const days = calculateActiveDays(dateMode, selectedDays);

      const activeSchedule: CreateActiveSchedule = {
        schedule_id: "",
        selected_days: days,
        repeat_weekly: recurring,
        specific_date: dateMode === "specific" ? specificDate : undefined,
      };

      const schedule: CreateSchedule = {
        name: saveSchedule ? scheduleName.trim() : "",
        schedule_list: selectedReviewItems,
        temporary: !saveSchedule,
      };

      // await processSaveing()
      onConfirm(activeSchedule, schedule);
      setIsSchedActivatedModalOpen(true);
    } catch (error) {
      console.error("[useSetActiveModal] Confirm failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    dateMode,
    recurring,
    selectedDays,
    specificDate,
    showDatePicker,
    canConfirm,
    isSubmitting,
    summary,
    setRecurring,
    toggleDay,
    setShowDatePicker,
    handleModeSelect,
    handleDateChange,
    handleClose,
    handleConfirm,
    saveSchedule,
    setSaveSchedule,
    scheduleName,
    setScheduleName,
  };
}
