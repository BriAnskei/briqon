import { useState } from "react";
import { Platform } from "react-native";
import { DateMode, buildSummary } from "../../util/reviewHelpers";

interface UseSetActiveModalOptions {
  onClose: () => void;
  onConfirm: () => void;
}

export function useSetActiveModal({
  onClose,
  onConfirm,
}: UseSetActiveModalOptions) {
  const [dateMode, setDateMode] = useState<DateMode>(null);
  const [recurring, setRecurring] = useState(false);
  const [startDay, setStartDay] = useState(0);
  const [endDay, setEndDay] = useState(4);
  const [specificDate, setSpecificDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const canConfirm = dateMode !== null;

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
    // reset all state on dismiss
    setDateMode(null);
    setRecurring(false);
    setShowDatePicker(false);
    setStartDay(0);
    setEndDay(4);
    setSpecificDate(new Date());
    onClose();
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm();
  };

  return {
    // state
    dateMode,
    recurring,
    startDay,
    endDay,
    specificDate,
    showDatePicker,
    canConfirm,
    summary,
    // actions
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
