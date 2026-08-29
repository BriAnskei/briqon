import DateTimePicker from "@react-native-community/datetimepicker";
import { useMemo } from "react";
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
import {
  DAYS,
  type UseSetActiveModalState,
} from "@/features/schedule/hooks/generation/useSetActiveModal";
import { Colors, Radius, Shadow } from "@/type/theme";

export function SetActiveModal(state: UseSetActiveModalState) {
  const s = useSStyles();

  const {
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
    setRecurring,
    setShowDatePicker,
    setShowRangeDatePicker,
    handleModeSelect,
    toggleDay,
    handleDateChange,
    handleRangeDateChange,
    handleClose,
    handleConfirm,
    isOpen,
  } = state;

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
              {isTodayAvailable && (
                <OptionPill
                  label="Today"
                  selected={dateMode === "today"}
                  onPress={() => handleModeSelect("today")}
                />
              )}
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
                  recurring={recurring}
                  rangeAnchorDate={rangeAnchorDate}
                  showRangeDatePicker={showRangeDatePicker}
                  rangeResolvedStart={rangeResolvedStart}
                  rangeResolvedEnd={rangeResolvedEnd}
                  onOpenRangeDatePicker={() => setShowRangeDatePicker(true)}
                  onRangeDateChange={handleRangeDateChange}
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
              <Text style={[s.confirmText, isConfirmBlocked && s.confirmTextDisabled]}>
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
  recurring,
  rangeAnchorDate,
  showRangeDatePicker,
  rangeResolvedStart,
  rangeResolvedEnd,
  onOpenRangeDatePicker,
  onRangeDateChange,
}: {
  selectedDays: string[];
  onToggleDay: (day: string) => void;
  disabledDays: string[];
  recurring: boolean;
  rangeAnchorDate: Date;
  showRangeDatePicker: boolean;
  rangeResolvedStart: Date | null;
  rangeResolvedEnd: Date | null;
  onOpenRangeDatePicker: () => void;
  onRangeDateChange: (
    event: import("@react-native-community/datetimepicker").DateTimePickerEvent,
    selectedDate?: Date,
  ) => void;
}) {
  const s = useSStyles();

  const isSingleDay =
    rangeResolvedStart &&
    rangeResolvedEnd &&
    rangeResolvedStart.toDateString() === rangeResolvedEnd.toDateString();

  return (
    <View style={s.dayRangeWrap}>
      {/* "Starts From" now renders first for non-recurring schedules —
			    day chips stay disabled until a start date is confirmed here. */}
      {!recurring && (
        <View style={s.rangeStartWrap}>
          <Text style={s.rangeStartLabel}>Starts From</Text>

          {showRangeDatePicker ? (
            <DateTimePicker
              value={rangeAnchorDate}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              minimumDate={new Date()}
              onChange={onRangeDateChange}
            />
          ) : (
            <TouchableOpacity
              style={s.changeDateBtn}
              onPress={onOpenRangeDatePicker}
              activeOpacity={0.8}
            >
              <Text style={s.changeDateText}>
                📅 {formatDate(rangeAnchorDate)} · Tap to change
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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

      {!recurring && rangeResolvedStart && rangeResolvedEnd && (
        <Text style={s.rangeResolvedHint}>
          Active {formatDate(rangeResolvedStart)}
          {!isSingleDay ? ` – ${formatDate(rangeResolvedEnd)}` : ""}
        </Text>
      )}
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
          backgroundColor: colors.bgModal,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTopWidth: 1,
          borderColor: colors.border,
          maxHeight: "88%",
          paddingBottom: Platform.OS === "ios" ? 36 : 20,
        },
        handle: {
          width: 32,
          height: 3,
          borderRadius: 2,
          backgroundColor: colors.border,
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
          borderBottomColor: colors.border,
        },
        title: {
          fontSize: 18,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: colors.textPrimary,
        },
        closeBtn: {
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.bgElevated,
          alignItems: "center",
          justifyContent: "center",
        },
        closeBtnText: {
          fontSize: 11,
          fontFamily: "DMMono-Medium",
          fontWeight: "500",
          color: colors.textSecondary,
        },
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
          backgroundColor: colors.accent,
          flexShrink: 0,
        },
        summaryText: {
          fontSize: 13,
          fontFamily: "Inter-Medium",
          fontWeight: "500",
          color: colors.accent,
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
          fontSize: 12,
          fontFamily: "Inter-Medium",
          fontWeight: "500",
          color: colors.textMuted,
          letterSpacing: 0.5,
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
          borderColor: colors.border,
          backgroundColor: colors.bgCard,
        },
        pillActive: {
          borderColor: colors.accent,
          backgroundColor: colors.accent + "1A",
        },
        pillText: {
          fontSize: 13,
          fontFamily: "Inter-Medium",
          fontWeight: "500",
          color: colors.textSecondary,
        },
        pillTextActive: {
          color: colors.accent,
          fontFamily: "Inter-Medium",
          fontWeight: "500",
        },
        optionCard: {
          backgroundColor: colors.bgCard,
          borderRadius: Radius.md,
          borderWidth: 1,
          borderColor: colors.border,
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
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: colors.textPrimary,
          marginBottom: 2,
        },
        optionCardSubtitle: {
          fontSize: 12,
          fontFamily: "Inter",
          fontWeight: "400",
          color: colors.textMuted,
        },
        radioOuter: {
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        },
        radioOuterActive: { borderColor: colors.accent },
        radioInner: {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.accent,
        },
        dayRangeWrap: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
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
          borderColor: colors.border,
          backgroundColor: colors.bgElevated,
          alignItems: "center",
          justifyContent: "center",
        },
        dayChipActive: {
          borderColor: colors.accent,
          backgroundColor: colors.accent,
        },
        dayChipDisabled: { opacity: 0.4 },
        dayChipText: {
          fontSize: 12,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: colors.textSecondary,
        },
        dayChipTextActive: { color: colors.white },
        dayChipTextDisabled: { color: colors.textMuted },
        rangeStartWrap: {
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingBottom: 12,
          gap: 8,
        },
        rangeStartLabel: {
          fontSize: 12,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: colors.textSecondary,
        },
        rangeResolvedHint: {
          fontSize: 12,
          fontFamily: "Inter-Medium",
          fontWeight: "500",
          color: colors.textMuted,
          marginTop: 2,
        },
        datePickerWrap: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        changeDateBtn: {
          paddingVertical: 10,
          paddingHorizontal: 14,
          backgroundColor: colors.bgElevated,
          borderRadius: Radius.md,
          borderWidth: 1,
          borderColor: colors.accent,
        },
        changeDateText: {
          fontSize: 13,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: colors.accent,
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
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: colors.textPrimary,
          marginBottom: 2,
        },
        repeatSubtitle: {
          fontSize: 12,
          fontFamily: "Inter",
          fontWeight: "400",
          color: colors.textMuted,
        },
        actions: {
          flexDirection: "row",
          gap: 10,
          paddingHorizontal: 16,
          paddingTop: 14,
        },
        cancelBtn: {
          flex: 1,
          backgroundColor: colors.bgElevated,
          borderRadius: Radius.lg,
          paddingVertical: 15,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.border,
        },
        cancelText: {
          fontSize: 15,
          fontFamily: "Inter-Medium",
          fontWeight: "500",
          color: colors.textSecondary,
        },
        confirmBtn: {
          flex: 2,
          backgroundColor: colors.accent,
          borderRadius: Radius.lg,
          paddingVertical: 15,
          alignItems: "center",
          justifyContent: "center",
          ...Shadow.accent,
        },
        confirmBtnDisabled: {
          backgroundColor: colors.bgElevated,
          shadowOpacity: 0,
          elevation: 0,
        },
        confirmText: {
          fontSize: 15,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: colors.white,
        },
        confirmTextDisabled: { color: colors.textMuted },
      }),
    [colors],
  );
}
