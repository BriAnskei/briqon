import React from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Platform,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors, Radius, Shadow } from "@/type/theme";
import { useSetActiveModal } from "@/features/schedule-conversation/hooks/review/useSetActiveModal";
import { TimeFormatter } from "@/utils/TimeFormatter";
import { DayRangeExpanded } from "../DayRangeExpanded";
import { OptionPill } from "../OptionPill";
import { CreateActiveSchedule } from "@/src/models/active_schedule.model";
import { CreateSchedule } from "@/src/models/schedule.model";
import { useConflictActivationModal } from "@/features/schedule-conversation/hooks/review/useConflictActivationModal";
import { ConflictActivationModal } from "./ConflicActivationModal";

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (
    activeSchedule: CreateActiveSchedule,
    schedule: CreateSchedule,
  ) => void;
  isScheduleAlreadySave: boolean;
  setIsSchedActivatedModalOpen: (n: boolean) => void;
}

export function SetActiveModal({
  visible,
  onClose,
  onConfirm,
  isScheduleAlreadySave,
  setIsSchedActivatedModalOpen,
}: Props) {
  const {
    isVisible: isConflictModalVisible,
    conflictError,
    openConflictModal,
    closeConflictModal,
  } = useConflictActivationModal();

  const {
    dateMode,
    recurring,
    selectedDays,
    specificDate,
    showDatePicker,
    disabledDays,
    rangeStartsAt,
    showRangeStartsPicker,
    canConfirm,
    summary,
    isSubmitting,
    setRecurring,
    toggleDay,
    setShowDatePicker,
    setShowRangeStartsPicker,
    handleModeSelect,
    handleDateChange,
    handleRangeStartsAtChange,
    handleClose,
    handleConfirm,
    scheduleName,
    setScheduleName,
    saveSchedule,
    setSaveSchedule,
  } = useSetActiveModal({
    onClose,
    onConfirm,
    setIsSchedActivatedModalOpen,
    openConflictModal,
  });

  const isConfirmBlocked =
    !canConfirm || isSubmitting || (saveSchedule && scheduleName.trim() === "");

  return (
    <>
      <Modal
        visible={visible}
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
                        ? TimeFormatter.formatDate(specificDate)
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
                          📅 {TimeFormatter.formatDate(specificDate)} · Tap to change
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

              {/* Save schedule toggle */}
              <View style={s.divider} />
              {!isScheduleAlreadySave && (
                <View style={s.repeatRow}>
                  <View style={s.repeatLeft}>
                    <Text style={s.repeatTitle}>Save this schedule</Text>
                    <Text style={s.repeatSubtitle}>
                      Keep it in your saved schedules list
                    </Text>
                  </View>
                  <Switch
                    value={saveSchedule}
                    onValueChange={(val) => {
                      setSaveSchedule(val);
                      if (!val) setScheduleName("");
                    }}
                    trackColor={{
                      false: Colors.bgElevated,
                      true: Colors.accent,
                    }}
                    thumbColor={Colors.white}
                  />
                </View>
              )}

              {/* Schedule name input */}
              {saveSchedule && (
                <View style={s.nameInputWrap}>
                  <TextInput
                    style={s.nameInput}
                    placeholder="Schedule name…"
                    placeholderTextColor={Colors.textMuted}
                    value={scheduleName}
                    onChangeText={setScheduleName}
                    maxLength={60}
                    autoFocus
                    returnKeyType="done"
                  />
                  {scheduleName.trim() === "" && (
                    <Text style={s.nameHint}>A name is required to save</Text>
                  )}
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
                  {isSubmitting
                    ? "Scheduling…"
                    : saveSchedule
                      ? "Save & Activate"
                      : "Confirm"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ConflictActivationModal
        visible={isConflictModalVisible}
        error={conflictError}
        isNewRecurring={recurring}
        newScheduleDays={selectedDays}
        onClose={closeConflictModal}
        onProceed={() => {}}
      />
    </>
  );
}

function Radio({ active }: { active: boolean }) {
  return (
    <View style={[s.radioOuter, active && s.radioOuterActive]}>
      {active && <View style={s.radioInner} />}
    </View>
  );
}

const s = StyleSheet.create({
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
  changeDateText: { fontSize: 13, fontWeight: "600", color: Colors.accent },
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
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  nameInputWrap: {
    marginTop: 2,
    marginBottom: 4,
    gap: 6,
  },
  nameInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  nameHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 4,
  },
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
  cancelText: { fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
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
});
