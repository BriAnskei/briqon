import React from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors, Radius, Shadow } from "@/type/theme";
import { useSetActiveModal } from "@/features/schedule-conversation/hooks/review/userSetActiveModal";
import {
  FULL_DAYS,
  formatDate,
} from "@/features/schedule-conversation/util/reviewHelpers";
import { DayRangeExpanded } from "../DayRangeExpanded";
import { OptionPill } from "../OptionPill";

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SetActiveModal({ visible, onClose, onConfirm }: Props) {
  const {
    dateMode,
    recurring,
    startDay,
    endDay,
    specificDate,
    showDatePicker,
    canConfirm,
    summary,
    setRecurring,
    setStartDay,
    setEndDay,
    setShowDatePicker,
    handleModeSelect,
    handleDateChange,
    handleClose,
    handleConfirm,
  } = useSetActiveModal({ onClose, onConfirm });

  return (
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

            {/* Day range */}
            <Text style={s.sectionLabel}>Day Range</Text>
            <View style={s.optionCard}>
              <TouchableOpacity
                style={s.optionCardHeader}
                onPress={() => handleModeSelect("range")}
                activeOpacity={0.8}
              >
                <View style={s.optionCardLeft}>
                  <Text style={s.optionCardTitle}>Day of the Week</Text>
                  <Text style={s.optionCardSubtitle}>
                    {dateMode === "range"
                      ? `${FULL_DAYS[startDay]} – ${FULL_DAYS[endDay]}`
                      : "e.g. Monday to Friday"}
                  </Text>
                </View>
                <Radio active={dateMode === "range"} />
              </TouchableOpacity>

              {dateMode === "range" && (
                <DayRangeExpanded
                  startDay={startDay}
                  endDay={endDay}
                  onStartDay={setStartDay}
                  onEndDay={setEndDay}
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

            {/* Repeat toggle */}
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
                trackColor={{ false: Colors.bgElevated, true: Colors.accent }}
                thumbColor={Colors.white}
              />
            </View>
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
              style={[s.confirmBtn, !canConfirm && s.confirmBtnDisabled]}
              onPress={handleConfirm}
              activeOpacity={0.88}
              disabled={!canConfirm}
            >
              <Text
                style={[s.confirmText, !canConfirm && s.confirmTextDisabled]}
              >
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Inline Radio indicator ────────────────────────────────────────────────────

function Radio({ active }: { active: boolean }) {
  return (
    <View style={[s.radioOuter, active && s.radioOuterActive]}>
      {active && <View style={s.radioInner} />}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
