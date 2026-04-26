import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Switch,
  Modal,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { Colors, Radius, Shadow } from "@/type/theme";

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_ITEMS = [
  { activity: "Morning Run", startTime: "6:00 AM", endTime: "6:45 AM" },
  { activity: "Shower & Breakfast", startTime: "6:45 AM", endTime: "7:30 AM" },
  { activity: "Deep Work Block", startTime: "8:00 AM", endTime: "10:00 AM" },
  { activity: "Email & Slack", startTime: "10:00 AM", endTime: "10:30 AM" },
  { activity: "Lunch Break", startTime: "12:00 PM", endTime: "1:00 PM" },
  { activity: "Focus Session", startTime: "1:00 PM", endTime: "3:30 PM" },
  { activity: "Review & Planning", startTime: "4:00 PM", endTime: "5:00 PM" },
  { activity: "Wind Down", startTime: "9:00 PM", endTime: "10:00 PM" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const ACCENT_COLORS = [
  "#7B6FFF",
  "#1FD8A0",
  "#FF5273",
  "#F59E0B",
  "#38BDF8",
  "#A78BFA",
  "#FB7185",
  "#34D399",
];

type DateMode = "today" | "tomorrow" | "range" | "specific" | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function offsetDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function buildSummary(
  mode: DateMode,
  recurring: boolean,
  startDay: number,
  endDay: number,
  specificDate: Date,
): string {
  const repeatSuffix = recurring ? "· Every week" : "· One time";
  switch (mode) {
    case "today":
      return `Active today · ${formatDate(new Date())}${recurring ? " · Every week" : ""}`;
    case "tomorrow":
      return `Active tomorrow · ${formatDate(offsetDate(1))}${recurring ? " · Every week" : ""}`;
    case "range":
      return `${FULL_DAYS[startDay]} – ${FULL_DAYS[endDay]} ${repeatSuffix}`;
    case "specific":
      return `${formatDate(specificDate)} ${repeatSuffix}`;
    default:
      return "";
  }
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function ScheduleListItem({
  item,
  index,
}: {
  item: (typeof MOCK_ITEMS)[0];
  index: number;
}) {
  const color = ACCENT_COLORS[index % ACCENT_COLORS.length];
  return (
    <View style={s.listItem}>
      <View style={[s.listAccent, { backgroundColor: color }]} />
      <View style={[s.listDot, { backgroundColor: color }]} />
      <View style={s.listBody}>
        <Text style={s.listTitle}>{item.activity}</Text>
        <Text style={s.listTime}>
          {item.startTime} – {item.endTime}
        </Text>
      </View>
    </View>
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
  startDay,
  endDay,
  onStartDay,
  onEndDay,
}: {
  startDay: number;
  endDay: number;
  onStartDay: (i: number) => void;
  onEndDay: (i: number) => void;
}) {
  return (
    <View style={s.rangeContainer}>
      <View style={s.rangeRow}>
        <Text style={s.rangeLabel}>From</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.dayScroll}
        >
          {DAYS.map((d, i) => (
            <TouchableOpacity
              key={d}
              style={[s.dayChip, startDay === i && s.dayChipActive]}
              onPress={() => onStartDay(i)}
              activeOpacity={0.8}
            >
              <Text
                style={[s.dayChipText, startDay === i && s.dayChipTextActive]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={s.rangeRow}>
        <Text style={s.rangeLabel}>To</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.dayScroll}
        >
          {DAYS.map((d, i) => (
            <TouchableOpacity
              key={d}
              style={[s.dayChip, endDay === i && s.dayChipActive]}
              onPress={() => onEndDay(i)}
              activeOpacity={0.8}
            >
              <Text
                style={[s.dayChipText, endDay === i && s.dayChipTextActive]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Set Active Modal ─────────────────────────────────────────────────────────

function SetActiveModal({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
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
    if (mode === "specific") setShowDatePicker(true);
    else setShowDatePicker(false);
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.handle} />

          {/* ── Header ── */}
          <View style={m.header}>
            <Text style={m.title}>When should this be active?</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={m.closeBtn}
              activeOpacity={0.8}
            >
              <Text style={m.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── Live summary — shown only after a selection ── */}
          {dateMode !== null && (
            <View style={m.summaryCard}>
              <View style={m.summaryDot} />
              <Text style={m.summaryText}>{summary}</Text>
            </View>
          )}

          {/* ── Scrollable options ── */}
          <ScrollView
            style={m.scrollArea}
            contentContainerStyle={m.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Quick picks */}
            <Text style={m.sectionLabel}>Quick Pick</Text>
            <View style={m.pillRow}>
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
            <Text style={m.sectionLabel}>Day Range</Text>
            <View style={m.optionCard}>
              <TouchableOpacity
                style={m.optionCardHeader}
                onPress={() => handleModeSelect("range")}
                activeOpacity={0.8}
              >
                <View style={m.optionCardLeft}>
                  <Text style={m.optionCardTitle}>Day of the Week</Text>
                  <Text style={m.optionCardSubtitle}>
                    {dateMode === "range"
                      ? `${FULL_DAYS[startDay]} – ${FULL_DAYS[endDay]}`
                      : "e.g. Monday to Friday"}
                  </Text>
                </View>
                <View
                  style={[
                    m.radioOuter,
                    dateMode === "range" && m.radioOuterActive,
                  ]}
                >
                  {dateMode === "range" && <View style={m.radioInner} />}
                </View>
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
            <Text style={m.sectionLabel}>Specific Date</Text>
            <View style={m.optionCard}>
              <TouchableOpacity
                style={m.optionCardHeader}
                onPress={() => handleModeSelect("specific")}
                activeOpacity={0.8}
              >
                <View style={m.optionCardLeft}>
                  <Text style={m.optionCardTitle}>Pick a Date</Text>
                  <Text style={m.optionCardSubtitle}>
                    {dateMode === "specific"
                      ? formatDate(specificDate)
                      : "Choose from calendar"}
                  </Text>
                </View>
                <View
                  style={[
                    m.radioOuter,
                    dateMode === "specific" && m.radioOuterActive,
                  ]}
                >
                  {dateMode === "specific" && <View style={m.radioInner} />}
                </View>
              </TouchableOpacity>

              {dateMode === "specific" && (
                <View style={m.datePickerWrap}>
                  {showDatePicker ? (
                    <DateTimePicker
                      value={specificDate}
                      mode="date"
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      minimumDate={new Date()}
                      onChange={(_, date) => {
                        if (Platform.OS === "android") setShowDatePicker(false);
                        if (date) setSpecificDate(date);
                      }}
                    />
                  ) : (
                    <TouchableOpacity
                      style={m.changeDateBtn}
                      onPress={() => setShowDatePicker(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={m.changeDateText}>
                        📅 {formatDate(specificDate)} · Tap to change
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* ── Repeat every week — part of the input, no border separation ── */}
            <View style={m.repeatRow}>
              <View style={m.repeatLeft}>
                <Text style={m.repeatTitle}>Repeat every week</Text>
                <Text style={m.repeatSubtitle}>
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

          {/* ── Modal actions ── */}
          <View style={m.actions}>
            <TouchableOpacity
              style={m.cancelBtn}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={m.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[m.confirmBtn, !canConfirm && m.confirmBtnDisabled]}
              onPress={canConfirm ? onConfirm : undefined}
              activeOpacity={0.88}
              disabled={!canConfirm}
            >
              <Text
                style={[m.confirmText, !canConfirm && m.confirmTextDisabled]}
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Review Schedule</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.sectionLabel}>Schedule Preview</Text>
        <View style={s.card}>
          {MOCK_ITEMS.map((item, index) => (
            <ScheduleListItem key={index} item={item} index={index} />
          ))}
        </View>
      </ScrollView>

      {/* ── Pinned bottom buttons ── */}
      <View
        style={[
          s.btnBar,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16 },
        ]}
      >
        <TouchableOpacity
          style={s.saveBtn}
          activeOpacity={0.8}
          onPress={() => {
            // save logic handled later
          }}
        >
          <Text style={s.saveBtnText}>Save Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.activeBtn}
          activeOpacity={0.88}
          onPress={() => setModalVisible(true)}
        >
          <Text style={s.activeBtnText}>Set as Active</Text>
        </TouchableOpacity>
      </View>

      <SetActiveModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={() => {
          setModalVisible(false);
          // confirm logic handled later
        }}
      />
    </SafeAreaView>
  );
}

// ─── Screen Styles ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backIcon: { fontSize: 22, color: Colors.textSecondary },
  headerTitle: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 2,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingRight: 16,
  },
  listAccent: { width: 3, alignSelf: "stretch" },
  listDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
    marginHorizontal: 12,
  },
  listBody: { flex: 1, paddingVertical: 13 },
  listTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  listTime: { fontSize: 12, color: Colors.textMuted },

  // Pinned bottom bar
  btnBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  activeBtn: {
    flex: 2,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.lg,
    backgroundColor: Colors.accent,
    ...Shadow.accent,
  },
  activeBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
  },

  // Shared — used by DayRangeExpanded inside modal
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
  },
  pillText: { fontSize: 13, fontWeight: "500", color: Colors.textSecondary },
  pillTextActive: { color: Colors.accent, fontWeight: "600" },
  rangeContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  rangeRow: { gap: 8 },
  rangeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  dayScroll: { gap: 6, paddingBottom: 4 },
  dayChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  dayChipText: { fontSize: 13, fontWeight: "500", color: Colors.textSecondary },
  dayChipTextActive: { color: Colors.white, fontWeight: "600" },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────

const m = StyleSheet.create({
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

  // Header
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

  // Live summary card — sits right below header
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

  // Scrollable options area
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

  // Repeat toggle — no border, blends in as part of the input area
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

  // Modal actions
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
