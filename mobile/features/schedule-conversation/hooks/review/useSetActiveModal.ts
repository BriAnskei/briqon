import { useState } from "react";
import { Platform } from "react-native";
import { DateMode, buildSummary } from "../../util/reviewHelpers";
import { useSchedule } from "@/context/ScheduleContext";
import { scheduleSchedule } from "@/services/alarm/alarmService";
import { ActiveScheduleConfig } from "@/type/alarm";

interface UseSetActiveModalOptions {
  onClose: () => void;
  onConfirm: () => void;
}

export function useSetActiveModal({
  onClose,
  onConfirm,
}: UseSetActiveModalOptions) {
  const { selectedReviewItems } = useSchedule();

  const [dateMode, setDateMode] = useState<DateMode>(null);
  const [recurring, setRecurring] = useState(false);
  const [startDay, setStartDay] = useState(0);
  const [endDay, setEndDay] = useState(4);
  const [specificDate, setSpecificDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canConfirm = dateMode !== null && !isSubmitting;

  const summary = buildSummary(
    dateMode,
    recurring,
    startDay,
    endDay,
    specificDate,
  );

  const handleModeSelect = (mode: DateMode) => {
    setDateMode((prev) => (prev === mode ? null : mode));
    setShowDatePicker(mode === "specific");
  };

  const handleDateChange = (_: unknown, date?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (date) setSpecificDate(date);
  };

  const handleClose = () => {
    setDateMode(null);
    setRecurring(false);
    setShowDatePicker(false);
    setStartDay(0);
    setEndDay(4);
    setSpecificDate(new Date());
    onClose();
  };

  const handleConfirm = async () => {
    if (!canConfirm || !dateMode) return;

    setIsSubmitting(true);
    try {
      const config: ActiveScheduleConfig = {
        id: Date.now().toString(),
        scheduleItems: selectedReviewItems,
        dateMode,
        startDay,
        endDay,
        specificDate:
          dateMode === "specific" ? specificDate.toISOString() : undefined,
        recurring,
        enabled: true,
      };

      await scheduleSchedule(config);
      onConfirm();
    } catch (error) {
      console.error("Failed to schedule alarms:", error);
      // you can hook your existing showToast here if you expose it from context
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    dateMode,
    recurring,
    startDay,
    endDay,
    specificDate,
    showDatePicker,
    canConfirm,
    isSubmitting,
    summary,
    setRecurring,
    setStartDay,
    setEndDay,
    setShowDatePicker,
    handleModeSelect,
    handleDateChange,
    handleClose,
    handleConfirm,
  };
}
