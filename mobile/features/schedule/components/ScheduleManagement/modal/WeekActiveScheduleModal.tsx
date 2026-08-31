import { ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { ComponentSize, FontFamily, Radius } from "@/type/theme";

// ---------------------------------------------------------------------------
// Types — mirrors the shape used in SchedulesScreen. Kept local/duck-typed so
// this component has no import dependency on that screen's mock types.
// ---------------------------------------------------------------------------
type ActiveType = "days" | "date";

interface Activation {
  active_type: ActiveType;
  recurring: boolean;
  days_of_week?: number[];
  specific_date?: string;
}

interface Contract {
  starts_at: string;
  ends_at: string;
}

export interface WeekViewSchedule {
  id?: string;
  name: string;
  is_active: boolean;
  activation?: Activation;
  contract?: Contract;
}

interface WeekActiveSchedulesModalProps {
  visible: boolean;
  onClose: () => void;
  schedules: WeekViewSchedule[];
  onOpenSchedule?: (schedule: WeekViewSchedule) => void;
}

// ---------------------------------------------------------------------------
// Date helpers — all operate on local time, Sunday-start weeks.
// ---------------------------------------------------------------------------
const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getWeekStart(reference: Date, weekOffset: number): Date {
  const d = startOfDay(reference);
  const sunday = new Date(d.getTime() - d.getDay() * MS_PER_DAY);
  return new Date(sunday.getTime() + weekOffset * 7 * MS_PER_DAY);
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from(
    { length: 7 },
    (_, i) => new Date(weekStart.getTime() + i * MS_PER_DAY),
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function parseISODate(iso: string): Date {
  // Treat contract/specific_date strings as local calendar dates (no TZ shift).
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatDay(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatWeekRangeLabel(weekStart: Date): string {
  const weekEnd = new Date(weekStart.getTime() + 6 * MS_PER_DAY);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();

  const startLabel = weekStart.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const endLabel = sameMonth
    ? weekEnd.toLocaleDateString(undefined, { day: "numeric" })
    : weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const yearSuffix = sameYear ? "" : `, ${weekEnd.getFullYear()}`;
  return `${startLabel} – ${endLabel}${yearSuffix}`;
}

// ---------------------------------------------------------------------------
// Determines whether a schedule is active on a specific calendar day.
// ---------------------------------------------------------------------------
function isScheduleActiveOnDay(schedule: WeekViewSchedule, day: Date): boolean {
  if (!schedule.is_active) return false;

  const activation = schedule.activation;

  // No activation configured yet (e.g. an unsaved draft) — fall back to the
  // contract window alone, since there's no day-of-week/date rule to check.
  if (!activation) {
    if (!schedule.contract) return false;
    const start = parseISODate(schedule.contract.starts_at);
    const end = parseISODate(schedule.contract.ends_at);
    return day.getTime() >= start.getTime() && day.getTime() <= end.getTime();
  }

  if (activation.active_type === "date") {
    if (!activation.specific_date) return false;
    return isSameDay(day, parseISODate(activation.specific_date));
  }

  // "days" type
  const days = activation.days_of_week ?? [];
  if (!days.includes(day.getDay())) return false;

  if (activation.recurring) return true; // weekly repeat forever, no window

  // One-time "days" schedule needs a contract window to bound it.
  if (!schedule.contract) return false;
  const start = parseISODate(schedule.contract.starts_at);
  const end = parseISODate(schedule.contract.ends_at);
  return day.getTime() >= start.getTime() && day.getTime() <= end.getTime();
}

function scheduleLabel(schedule: WeekViewSchedule): string {
  return schedule.name.trim() || "Untitled Schedule";
}

function activationSummary(schedule: WeekViewSchedule): string | null {
  const a = schedule.activation;
  if (!a) return null;
  const typeLabel = a.active_type === "days" ? "Days" : "Date";
  const cadenceLabel = a.recurring ? "Recurring · Weekly" : "One-time";
  return `${typeLabel} · ${cadenceLabel}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function WeekActiveSchedulesModal({
  visible,
  onClose,
  schedules,
  onOpenSchedule,
}: WeekActiveSchedulesModalProps) {
  const s = useSStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(new Date().getDay());

  const today = useMemo(() => startOfDay(new Date()), []);
  const weekStart = useMemo(() => getWeekStart(today, weekOffset), [today, weekOffset]);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekLabel = useMemo(() => formatWeekRangeLabel(weekStart), [weekStart]);

  // Reset day selection to "today" (or the week's Sunday, if today isn't in
  // view) whenever the visible week changes.
  const goToWeek = (nextOffset: number) => {
    setWeekOffset(nextOffset);
    const nextWeekStart = getWeekStart(today, nextOffset);
    const containsToday = nextWeekStart.getTime() === getWeekStart(today, 0).getTime();
    setSelectedDayIndex(containsToday ? today.getDay() : 0);
  };

  const activeCountByDay = useMemo(
    () =>
      weekDays.map(
        (day) => schedules.filter((sch) => isScheduleActiveOnDay(sch, day)).length,
      ),
    [weekDays, schedules],
  );

  const selectedDay = weekDays[selectedDayIndex];
  const selectedDaySchedules = useMemo(
    () => schedules.filter((sch) => isScheduleActiveOnDay(sch, selectedDay)),
    [schedules, selectedDay],
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <Pressable style={s.backdropPress} onPress={onClose} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          {/* Header */}
          <View style={s.sheetHeader}>
            <View>
              <Text style={s.title}>Active This Week</Text>
              <Text style={s.subtitle}>{weekLabel}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Week navigation */}
          <View style={s.weekNavRow}>
            <Pressable
              onPress={() => goToWeek(weekOffset - 1)}
              hitSlop={8}
              style={s.navBtn}
            >
              <ChevronLeft size={20} color={colors.textSecondary} />
            </Pressable>
            <Text style={s.weekNavLabel}>{weekLabel}</Text>
            <Pressable
              onPress={() => goToWeek(weekOffset + 1)}
              hitSlop={8}
              style={s.navBtn}
            >
              <ChevronRight size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Day strip */}
          <View style={s.dayStrip}>
            {weekDays.map((day, idx) => {
              const isSelected = idx === selectedDayIndex;
              const isToday = isSameDay(day, today);
              const count = activeCountByDay[idx];
              return (
                <Pressable
                  key={idx}
                  onPress={() => setSelectedDayIndex(idx)}
                  style={[
                    s.dayCell,
                    isSelected && s.dayCellSelected,
                    isToday && !isSelected && s.dayCellToday,
                  ]}
                >
                  <Text
                    style={[
                      s.dayCellLetter,
                      isSelected ? s.dayCellTextSelected : s.dayCellTextDefault,
                    ]}
                  >
                    {DAY_LETTERS[idx]}
                  </Text>
                  <Text
                    style={[
                      s.dayCellNumber,
                      isSelected ? s.dayCellTextSelected : s.dayCellTextDefault,
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                  <View
                    style={[
                      s.dayDot,
                      count > 0
                        ? isSelected
                          ? s.dayDotOnSelected
                          : s.dayDotActive
                        : s.dayDotEmpty,
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>

          {/* Agenda for selected day */}
          <ScrollView
            style={s.body}
            contentContainerStyle={s.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={s.agendaDateLabel}>
              {isSameDay(selectedDay, today) ? "Today · " : ""}
              {formatDay(selectedDay)}
            </Text>

            {selectedDaySchedules.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyStateText}>No active schedules on this day.</Text>
              </View>
            ) : (
              selectedDaySchedules.map((sch, idx) => {
                const summary = activationSummary(sch);
                const key = sch.id ?? `draft-${idx}`;
                const content = (
                  <View style={s.scheduleRow}>
                    <View style={s.scheduleRowMain}>
                      <Text
                        style={
                          sch.name.trim() ? s.scheduleName : s.scheduleNamePlaceholder
                        }
                      >
                        {scheduleLabel(sch)}
                      </Text>
                      {summary && <Text style={s.scheduleMeta}>{summary}</Text>}
                    </View>
                    {onOpenSchedule && (
                      <ChevronRight size={16} color={colors.textMuted} />
                    )}
                  </View>
                );
                return onOpenSchedule ? (
                  <Pressable
                    key={key}
                    onPress={() => onOpenSchedule(sch)}
                    style={({ pressed }) => [
                      s.scheduleCard,
                      pressed && s.scheduleCardPressed,
                    ]}
                  >
                    {content}
                  </Pressable>
                ) : (
                  <View key={key} style={s.scheduleCard}>
                    {content}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles — matches the shell/backdrop/spacing conventions used by
// ScheduleActivationModal so this feels native to the rest of the app.
// ---------------------------------------------------------------------------
function useSStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.4)",
        },
        backdropPress: { flex: 1 },
        sheet: {
          backgroundColor: colors.bgModal,
          borderTopLeftRadius: ComponentSize.modalTopRadius,
          borderTopRightRadius: ComponentSize.modalTopRadius,
          paddingTop: 16,
          paddingHorizontal: 20,
          maxHeight: "85%",
        },
        sheetHeader: {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 12,
        },
        title: {
          fontSize: 18,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
          color: colors.textPrimary,
        },
        subtitle: {
          fontSize: 12,
          fontFamily: FontFamily.mono,
          fontWeight: "400",
          color: colors.textMuted,
          marginTop: 2,
        },
        weekNavRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        },
        navBtn: {
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bgElevated,
        },
        weekNavLabel: {
          fontSize: 13,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.textSecondary,
        },
        dayStrip: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 16,
        },
        dayCell: {
          flex: 1,
          alignItems: "center",
          paddingVertical: 8,
          borderRadius: Radius.md,
          gap: 4,
          marginHorizontal: 2,
        },
        dayCellSelected: { backgroundColor: colors.accent },
        dayCellToday: {
          borderWidth: 1,
          borderColor: colors.accent,
        },
        dayCellLetter: {
          fontSize: 10,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
        },
        dayCellNumber: {
          fontSize: 14,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
        },
        dayCellTextDefault: { color: colors.textSecondary },
        dayCellTextSelected: { color: colors.white },
        dayDot: {
          width: 5,
          height: 5,
          borderRadius: 3,
          marginTop: 2,
        },
        dayDotEmpty: { backgroundColor: "transparent" },
        dayDotActive: { backgroundColor: colors.accent },
        dayDotOnSelected: { backgroundColor: colors.white },
        body: { flexGrow: 0 },
        bodyContent: { gap: 10, paddingBottom: 8 },
        agendaDateLabel: {
          fontSize: 12,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.textMuted,
          marginBottom: 2,
        },
        emptyState: {
          paddingVertical: 28,
          alignItems: "center",
        },
        emptyStateText: {
          fontSize: 13,
          fontFamily: FontFamily.body,
          fontWeight: "400",
          color: colors.textMuted,
        },
        scheduleCard: {
          backgroundColor: colors.bgCard,
          borderRadius: Radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        scheduleCardPressed: { opacity: 0.7 },
        scheduleRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        scheduleRowMain: { gap: 4, flexShrink: 1 },
        scheduleName: {
          fontSize: 14,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
          color: colors.textPrimary,
        },
        scheduleNamePlaceholder: {
          fontSize: 14,
          fontFamily: FontFamily.body,
          fontWeight: "400",
          fontStyle: "italic",
          color: colors.textMuted,
        },
        scheduleMeta: {
          fontSize: 11,
          fontFamily: FontFamily.mono,
          fontWeight: "400",
          color: colors.textMuted,
          letterSpacing: 0.2,
        },
      }),
    [colors],
  );
}
