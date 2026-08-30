import { ChevronRight } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import {
  type ActivationScheduleInput,
  ScheduleActivationModal,
} from "@/features/schedule/components/ScheduleManagement/modal/ScheduleActivationModal";
import type { ScheduleItem } from "@/type/MessageTypes";
import { FontFamily, Radius, Shadow } from "@/type/theme";

// ---------------------------------------------------------------------------
type ActiveType = "days" | "date";

interface SavedActivation {
  active_type: ActiveType;
  recurring: boolean;
  days_of_week?: number[];
  specific_date?: string;
}

interface Contract {
  starts_at: string;
  ends_at: string;
}

interface MockSchedule {
  id?: string; // undefined => unsaved draft
  name: string; // "" allowed for unsaved drafts
  schedule_list: ScheduleItem[];
  temporary: boolean;
  is_active: boolean;
  /** Present only once configured via the existing SetActiveModal flow
   * (type/recurring/day-of-week). Absent on an unsaved draft. */
  activation?: SavedActivation;
  /** Validity window. Independent of `activation` — any active schedule can
   * have one, saved or not. Absent when recurring (weekly repeats have no
   * end date). */
  contract?: Contract;
}

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function getWeekday(iso: string): number {
  return new Date(iso).getDay();
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function formatContractRange(contract: Contract): string {
  if (contract.starts_at === contract.ends_at) return formatDate(contract.starts_at);
  return `${formatDate(contract.starts_at)} – ${formatDate(contract.ends_at)}`;
}

const TODAY = new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Mock data — covers:
//  1. Unsaved + active draft, with a today-only contract (no type/recurring
//     badges yet since it hasn't been configured)
//  2. Saved + active, fully configured, non-recurring -> shows contract
//  3. Saved + inactive (days/date, recurring/non-recurring)
// ---------------------------------------------------------------------------
const INITIAL_SCHEDULES: MockSchedule[] = [
  {
    id: undefined,
    name: "",
    temporary: true,
    is_active: true,
    contract: { starts_at: TODAY, ends_at: TODAY },
    schedule_list: [
      { start_time: "07:00", end_time: "07:30", activity: "Stretch & hydrate" },
      { start_time: "07:30", end_time: "08:00", activity: "Light cardio" },
    ],
  },
  {
    id: "01J8Z5",
    name: "Conference Prep",
    temporary: true,
    is_active: true,
    activation: { active_type: "days", recurring: false, days_of_week: [2, 4] },
    contract: { starts_at: "2026-09-20", ends_at: "2026-09-25" },
    schedule_list: [
      { start_time: "13:00", end_time: "14:00", activity: "Slide review" },
      { start_time: "14:00", end_time: "15:00", activity: "Rehearsal" },
    ],
  },
  {
    id: "01J8Z1",
    name: "Morning Routine",
    temporary: false,
    is_active: false,
    activation: { active_type: "days", recurring: true, days_of_week: [1, 2, 3, 4, 5] },
    schedule_list: [
      { start_time: "06:00", end_time: "06:15", activity: "Wake up alarm" },
      { start_time: "06:15", end_time: "06:45", activity: "Workout" },
    ],
  },
  {
    id: "01J8Z2",
    name: "Exam Week Study",
    temporary: true,
    is_active: false,
    activation: { active_type: "days", recurring: false, days_of_week: [1, 3, 5] },
    contract: { starts_at: "2026-09-01", ends_at: "2026-09-12" },
    schedule_list: [{ start_time: "18:00", end_time: "20:00", activity: "Review notes" }],
  },
  {
    id: "01J8Z3",
    name: "Doctor Appointment",
    temporary: true,
    is_active: false,
    activation: { active_type: "date", recurring: false, specific_date: "2026-09-05" },
    contract: { starts_at: "2026-09-05", ends_at: "2026-09-05" },
    schedule_list: [
      { start_time: "09:00", end_time: "09:30", activity: "Travel to clinic" },
    ],
  },
  {
    id: "01J8Z4",
    name: "Weekend Chill",
    temporary: false,
    is_active: false,
    activation: { active_type: "days", recurring: true, days_of_week: [0, 6] },
    schedule_list: [{ start_time: "10:00", end_time: "12:00", activity: "Sleep in" }],
  },

  // --- Additional mock data below ---
  {
    // Active + saved + "date" type (non-recurring, single-day contract)
    id: "01J8Z6",
    name: "Flight to Tokyo",
    temporary: true,
    is_active: true,
    activation: { active_type: "date", recurring: false, specific_date: "2026-10-02" },
    contract: { starts_at: "2026-10-02", ends_at: "2026-10-02" },
    schedule_list: [
      { start_time: "04:30", end_time: "05:00", activity: "Wake up" },
      { start_time: "05:00", end_time: "06:00", activity: "Head to airport" },
    ],
  },
  {
    // Active + saved + "days" type, recurring (currently live, weekly repeat)
    id: "01J8Z7",
    name: "Gym Days",
    temporary: false,
    is_active: true,
    activation: { active_type: "days", recurring: true, days_of_week: [1, 3, 5] },
    schedule_list: [
      { start_time: "17:30", end_time: "18:30", activity: "Strength training" },
    ],
  },
  {
    // Active + "date" type where the date is today (tests single-date contract label)
    id: "01J8Z8",
    name: "Product Launch Day",
    temporary: true,
    is_active: true,
    activation: { active_type: "date", recurring: false, specific_date: TODAY },
    contract: { starts_at: TODAY, ends_at: TODAY },
    schedule_list: [
      { start_time: "08:00", end_time: "09:00", activity: "Final checklist" },
      { start_time: "09:00", end_time: "10:00", activity: "Go live" },
    ],
  },
  {
    // Inactive + "date" type, different weekday than existing example
    id: "01J8Z9",
    name: "Dentist Visit",
    temporary: true,
    is_active: false,
    activation: { active_type: "date", recurring: false, specific_date: "2026-09-14" },
    contract: { starts_at: "2026-09-14", ends_at: "2026-09-14" },
    schedule_list: [{ start_time: "11:00", end_time: "11:30", activity: "Checkup" }],
  },
  {
    // Inactive + "days" type, non-recurring, multi-week contract spanning a month boundary
    id: "01J8ZA",
    name: "New Hire Onboarding",
    temporary: true,
    is_active: false,
    activation: { active_type: "days", recurring: false, days_of_week: [1, 2, 3, 4, 5] },
    contract: { starts_at: "2026-09-28", ends_at: "2026-10-09" },
    schedule_list: [
      { start_time: "09:00", end_time: "10:00", activity: "Team intro" },
      { start_time: "10:00", end_time: "12:00", activity: "Systems training" },
    ],
  },
  {
    // Active + unsaved draft + "days" type already configured
    // (tests Unsaved tag + badges + chips rendering together)
    id: undefined,
    name: "",
    temporary: true,
    is_active: true,
    activation: { active_type: "days", recurring: false, days_of_week: [2, 3] },
    contract: { starts_at: "2026-09-08", ends_at: "2026-09-16" },
    schedule_list: [{ start_time: "14:00", end_time: "16:00", activity: "Deep work" }],
  },
  {
    // Inactive + "days" type, recurring, single day only (edge case: one day chip active)
    id: "01J8ZB",
    name: "Sunday Meal Prep",
    temporary: false,
    is_active: false,
    activation: { active_type: "days", recurring: true, days_of_week: [0] },
    schedule_list: [
      { start_time: "16:00", end_time: "18:00", activity: "Cook for the week" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Day chips
// ---------------------------------------------------------------------------
function DayChips({ activeDays }: { activeDays: number[] }) {
  const s = useSStyles();
  return (
    <View style={s.chipRow}>
      {DAY_LETTERS.map((letter, idx) => {
        const active = activeDays.includes(idx);
        return (
          <View
            key={idx}
            style={[s.dayChip, active ? s.dayChipActive : s.dayChipInactive]}
          >
            <Text
              style={[
                s.dayChipText,
                active ? s.dayChipTextActive : s.dayChipTextInactive,
              ]}
            >
              {letter}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Schedule card
// ---------------------------------------------------------------------------
function ScheduleCard({
  schedule,
  onPress,
}: {
  schedule: MockSchedule;
  onPress: (schedule: MockSchedule) => void;
}) {
  const s = useSStyles();
  const { colors } = useTheme();
  const isSaved = !!schedule.id;
  const displayName = schedule.name || "Untitled Schedule";

  // Not active: name only.
  if (!schedule.is_active) {
    return (
      <Pressable
        onPress={() => onPress(schedule)}
        style={({ pressed }) => [s.card, s.cardRow, pressed && s.cardPressed]}
      >
        <Text style={s.cardTitle}>{displayName}</Text>
        <ChevronRight size={18} color={colors.textMuted} />
      </Pressable>
    );
  }

  // Active (saved or not): name/placeholder + tags, badges/chips only if
  // configured, contract shown whenever present regardless of save state.
  const activation = schedule.activation;
  const activeDays =
    activation?.active_type === "days"
      ? (activation.days_of_week ?? [])
      : activation?.active_type === "date" && activation.specific_date
        ? [getWeekday(activation.specific_date)]
        : [];

  return (
    <Pressable
      onPress={() => onPress(schedule)}
      style={({ pressed }) => [s.card, s.cardActive, pressed && s.cardPressed]}
    >
      <View style={s.cardHeaderRow}>
        <Text style={isSaved ? s.cardTitle : s.namePlaceholderTitle}>{displayName}</Text>
        <View style={s.headerRightGroup}>
          {!isSaved && (
            <View style={s.unsavedTag}>
              <Text style={s.unsavedTagText}>Unsaved</Text>
            </View>
          )}
          <View style={s.activeBadge}>
            <View style={s.activeDot} />
            <Text style={s.activeBadgeText}>Active</Text>
          </View>
          <ChevronRight size={18} color={colors.accent} />
        </View>
      </View>

      {activation && (
        <View style={s.badgeRow}>
          <View style={s.badge}>
            <Text style={s.badgeText}>
              {activation.active_type === "days" ? "Days" : "Date"}
            </Text>
          </View>
          <View style={s.badge}>
            <Text style={s.badgeText}>
              {activation.recurring ? "Recurring · Weekly" : "One-time"}
            </Text>
          </View>
        </View>
      )}

      {activeDays.length > 0 && <DayChips activeDays={activeDays} />}

      {schedule.contract && (
        <Text style={s.contractText}>{formatContractRange(schedule.contract)}</Text>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function SchedulesScreen() {
  const s = useSStyles();
  const [schedules, setSchedules] = useState<MockSchedule[]>(INITIAL_SCHEDULES);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const selected = selectedIndex !== null ? schedules[selectedIndex] : null;

  const handleOpenSchedule = useCallback(
    (schedule: MockSchedule) => {
      const idx = schedules.indexOf(schedule);
      setSelectedIndex(idx);
      setModalVisible(true);
    },
    [schedules],
  );

  const handleClose = useCallback(() => setModalVisible(false), []);

  const handleSave = useCallback(() => {
    if (selectedIndex === null) return;
    setSchedules((prev) =>
      prev.map((sch, idx) =>
        idx === selectedIndex
          ? {
              ...sch,
              id: sch.id ?? `01J${Math.random().toString(36).slice(2, 8)}`.toUpperCase(),
            }
          : sch,
      ),
    );
    // TODO: call your real save API here (POST CreateSchedule -> Schedule).
  }, [selectedIndex]);

  const handleRename = useCallback(
    (name: string) => {
      if (selectedIndex === null) return;
      setSchedules((prev) =>
        prev.map((sch, idx) => (idx === selectedIndex ? { ...sch, name } : sch)),
      );
      // TODO: persist rename to backend.
    },
    [selectedIndex],
  );

  const handleSetActive = useCallback(() => {
    if (selectedIndex === null) return;
    setSchedules((prev) =>
      prev.map((sch, idx) => ({ ...sch, is_active: idx === selectedIndex })),
    );
    // TODO: hand off to your existing SetActiveModal flow to configure
    // active_type/recurring/days/dates (and contract) before persisting.
  }, [selectedIndex]);

  const activationInput: ActivationScheduleInput | null = selected
    ? { id: selected.id, name: selected.name, schedule_list: selected.schedule_list }
    : null;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.brandName}>Briqon</Text>
        <Text style={s.brandTagline}>Smart Alarm Scheduling</Text>
      </View>

      {schedules.length === 0 ? (
        <View style={s.body}>
          <Text style={s.label}>Schedules</Text>
          <Text style={s.sub}>Your saved schedules will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={(item, idx) => item.id ?? `draft-${idx}`}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => (
            <ScheduleCard schedule={item} onPress={handleOpenSchedule} />
          )}
        />
      )}

      <ScheduleActivationModal
        visible={modalVisible}
        onClose={handleClose}
        schedule={activationInput}
        isActive={selected?.is_active ?? false}
        onSave={handleSave}
        onSetActive={handleSetActive}
        onRename={handleRename}
      />
    </View>
  );
}

function useSStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.bg },
        header: {
          paddingHorizontal: 24,
          paddingTop: Platform.OS === "ios" ? 62 : 44,
          paddingBottom: 8,
        },
        brandName: {
          fontSize: 24,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
          color: colors.textPrimary,
          letterSpacing: -0.4,
        },
        brandTagline: {
          fontSize: 11,
          fontFamily: FontFamily.mono,
          fontWeight: "400",
          color: colors.textMuted,
          marginTop: 2,
          letterSpacing: 0.3,
        },
        body: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
        label: {
          fontSize: 24,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
          color: colors.textPrimary,
        },
        sub: {
          fontSize: 13,
          fontFamily: FontFamily.body,
          fontWeight: "400",
          color: colors.textMuted,
        },
        listContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 12 },
        card: {
          backgroundColor: colors.bgCard,
          borderRadius: Radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 10,
          ...Shadow.card,
        },
        cardActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
        cardRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        cardPressed: { opacity: 0.7 },
        cardHeaderRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        headerRightGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
        cardTitle: {
          fontSize: 16,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
          color: colors.textPrimary,
        },
        namePlaceholderTitle: {
          fontSize: 16,
          fontFamily: FontFamily.body,
          fontWeight: "400",
          fontStyle: "italic",
          color: colors.textMuted,
        },
        unsavedTag: {
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: Radius.full,
          backgroundColor: colors.bgElevated,
        },
        unsavedTagText: {
          fontSize: 11,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.textMuted,
        },
        activeBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
        activeDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.accent,
        },
        activeBadgeText: {
          fontSize: 11,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.accent,
        },
        badgeRow: { flexDirection: "row", gap: 8 },
        badge: {
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: Radius.full,
          backgroundColor: colors.bgElevated,
        },
        badgeText: {
          fontSize: 11,
          fontFamily: FontFamily.mono,
          fontWeight: "400",
          color: colors.textMuted,
          letterSpacing: 0.2,
        },
        chipRow: { flexDirection: "row", gap: 6 },
        dayChip: {
          width: 22,
          height: 22,
          borderRadius: Radius.full,
          alignItems: "center",
          justifyContent: "center",
        },
        dayChipActive: { backgroundColor: colors.accent },
        dayChipInactive: { backgroundColor: colors.bgElevated },
        dayChipText: {
          fontSize: 10,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
        },
        dayChipTextActive: { color: colors.white },
        dayChipTextInactive: { color: colors.textMuted },
        contractText: {
          fontSize: 12,
          fontFamily: FontFamily.mono,
          fontWeight: "400",
          color: colors.textSecondary,
        },
      }),
    [colors],
  );
}
