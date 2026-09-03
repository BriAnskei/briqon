import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AppHeader, HeaderIconButton } from "@/components/AppHeader";
import { useTheme } from "@/context/ThemeContext";
import {
  type Activation,
  type ActivationIntent,
  type ActivationScheduleInput,
  canAddActivation,
  ScheduleActivationModal,
} from "@/features/schedule/components/ScheduleManagement/modal/ScheduleActivationModal";
import { WeekActiveSchedulesModal } from "@/features/schedule/components/ScheduleManagement/modal/WeekActiveScheduleModal";
import type { ScheduleItem } from "@/src/models/schedule.model";
import { Colors, FontFamily, Radius, Shadow } from "@/type/theme";

// ---------------------------------------------------------------------------
interface MockSchedule {
  id?: string; // undefined => unsaved draft
  name: string; // "" allowed for unsaved drafts
  schedule_list: ScheduleItem[];
  temporary: boolean;
  /**
   * A schedule-wide, singleton toggle — at most one schedule across the
   * whole list is active at a time (handleSetActive below flips every
   * other schedule off when this one turns on). Independent of
   * `activations`: an active schedule can have zero, one, or several
   * activations configured; is_active just says "this is the one the
   * device is currently following."
   */
  is_active: boolean;
  /**
   * The windows/patterns that make this schedule apply. At most one
   * `days`+recurring and one `days`+non-recurring entry are allowed (see
   * canAddActivation in the modal file); `date` entries are unlimited —
   * mirrors the iCalendar RRULE (capped, one pattern) + RDATE (unlimited
   * extra one-off dates) relationship.
   */
  activations: Activation[];
}

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function getWeekday(iso: string): number {
  return new Date(iso).getDay();
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function formatContractRange(contract: { starts_at: string; ends_at: string }): string {
  if (contract.starts_at === contract.ends_at) return formatDate(contract.starts_at);
  return `${formatDate(contract.starts_at)} – ${formatDate(contract.ends_at)}`;
}

const TODAY = new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Mock data — covers:
//  1. Unsaved + active draft, no activations configured yet
//  2/3/4. Single days activation (recurring / non-recurring, active/inactive)
//  5. Doctor Appointment — ACTIVE, THREE date activations (the "+N more"
//     card treatment)
//  6. Flight to Tokyo — ACTIVE, single date activation
//  7. Gym Days — ACTIVE, COMBO: one recurring days pattern *plus* two extra
//     one-off dates (the richest case — days block(s) + date summary
//     together on one card)
//  8. Saved + inactive, non-recurring days with a contract window
//  9/10. More single-activation variety (unsaved draft, recurring weekly)
//  Standup Rotation — ACTIVE, fills every slot: recurring days + a
//    non-recurring days override + a one-off date, all at once
//  Volunteer Shifts — ACTIVE, five date activations (stress-tests the
//    "+N more" collapse)
// ---------------------------------------------------------------------------
const INITIAL_SCHEDULES: MockSchedule[] = [
  {
    id: undefined,
    name: "",
    temporary: true,
    is_active: true,
    activations: [],
    schedule_list: [
      {
        start_time: "07:00",
        end_time: "07:30",
        activity: "Stretch & hydrate",
        enabled: false,
      },
      {
        start_time: "07:30",
        end_time: "08:00",
        activity: "Light cardio",
        enabled: false,
      },
    ],
  },
  {
    id: "01J8Z5",
    name: "Conference Prep",
    temporary: true,
    is_active: true,
    activations: [
      {
        id: "01J8Z5-a1",
        active_type: "days",
        recurring: false,
        days_of_week: [2, 4],
        contract: { starts_at: "2026-09-20", ends_at: "2026-09-25" },
      },
    ],
    schedule_list: [
      {
        start_time: "13:00",
        end_time: "14:00",
        activity: "Slide review",
        enabled: false,
      },
      { start_time: "14:00", end_time: "15:00", activity: "Rehearsal", enabled: false },
    ],
  },
  {
    id: "01J8Z1",
    name: "Morning Routine",
    temporary: false,
    is_active: false,
    activations: [
      {
        id: "01J8Z1-a1",
        active_type: "days",
        recurring: true,
        days_of_week: [1, 2, 3, 4, 5],
      },
    ],
    schedule_list: [
      {
        start_time: "06:00",
        end_time: "06:15",
        activity: "Wake up alarm",
        enabled: false,
      },
      { start_time: "06:15", end_time: "06:45", activity: "Workout", enabled: false },
    ],
  },
  {
    id: "01J8Z2",
    name: "Exam Week Study",
    temporary: true,
    is_active: false,
    activations: [
      {
        id: "01J8Z2-a1",
        active_type: "days",
        recurring: false,
        days_of_week: [1, 3, 5],
        contract: { starts_at: "2026-09-01", ends_at: "2026-09-12" },
      },
    ],
    schedule_list: [
      {
        start_time: "18:00",
        end_time: "20:00",
        activity: "Review notes",
        enabled: false,
      },
    ],
  },
  {
    id: "01J8Z3",
    name: "Doctor Appointment",
    temporary: true,
    is_active: true,
    activations: [
      {
        id: "01J8Z3-a1",
        active_type: "date",
        recurring: false,
        specific_date: "2026-09-05",
        contract: { starts_at: "2026-09-05", ends_at: "2026-09-05" },
      },
      {
        id: "01J8Z3-a2",
        active_type: "date",
        recurring: false,
        specific_date: "2026-09-19",
        contract: { starts_at: "2026-09-19", ends_at: "2026-09-19" },
      },
      {
        id: "01J8Z3-a3",
        active_type: "date",
        recurring: false,
        specific_date: "2026-10-03",
        contract: { starts_at: "2026-10-03", ends_at: "2026-10-03" },
      },
    ],
    schedule_list: [
      {
        start_time: "09:00",
        end_time: "09:30",
        activity: "Travel to clinic",
        enabled: false,
      },
    ],
  },
  {
    id: "01J8Z4",
    name: "Weekend Chill",
    temporary: false,
    is_active: false,
    activations: [
      { id: "01J8Z4-a1", active_type: "days", recurring: true, days_of_week: [0, 6] },
    ],
    schedule_list: [
      { start_time: "10:00", end_time: "12:00", activity: "Sleep in", enabled: false },
    ],
  },
  {
    id: "01J8Z6",
    name: "Flight to Tokyo",
    temporary: true,
    is_active: true,
    activations: [
      {
        id: "01J8Z6-a1",
        active_type: "date",
        recurring: false,
        specific_date: "2026-10-02",
        contract: { starts_at: "2026-10-02", ends_at: "2026-10-02" },
      },
    ],
    schedule_list: [
      { start_time: "04:30", end_time: "05:00", activity: "Wake up", enabled: false },
      {
        start_time: "05:00",
        end_time: "06:00",
        activity: "Head to airport",
        enabled: false,
      },
    ],
  },
  {
    id: "01J8Z7",
    name: "Gym Days",
    temporary: false,
    is_active: true,
    activations: [
      { id: "01J8Z7-a1", active_type: "days", recurring: true, days_of_week: [1, 3, 5] },
      {
        id: "01J8Z7-a2",
        active_type: "date",
        recurring: false,
        specific_date: "2026-09-10",
        contract: { starts_at: "2026-09-10", ends_at: "2026-09-10" },
      },
      {
        id: "01J8Z7-a3",
        active_type: "date",
        recurring: false,
        specific_date: "2026-09-24",
        contract: { starts_at: "2026-09-24", ends_at: "2026-09-24" },
      },
    ],
    schedule_list: [
      {
        start_time: "17:30",
        end_time: "18:30",
        activity: "Strength training",
        enabled: false,
      },
    ],
  },
  {
    id: "01J8Z8",
    name: "Product Launch Day",
    temporary: true,
    is_active: true,
    activations: [
      {
        id: "01J8Z8-a1",
        active_type: "date",
        recurring: false,
        specific_date: TODAY,
        contract: { starts_at: TODAY, ends_at: TODAY },
      },
    ],
    schedule_list: [
      {
        start_time: "08:00",
        end_time: "09:00",
        activity: "Final checklist",
        enabled: false,
      },
      { start_time: "09:00", end_time: "10:00", activity: "Go live", enabled: false },
    ],
  },
  {
    id: "01J8Z9",
    name: "Dentist Visit",
    temporary: true,
    is_active: false,
    activations: [
      {
        id: "01J8Z9-a1",
        active_type: "date",
        recurring: false,
        specific_date: "2026-09-14",
        contract: { starts_at: "2026-09-14", ends_at: "2026-09-14" },
      },
    ],
    schedule_list: [
      { start_time: "11:00", end_time: "11:30", activity: "Checkup", enabled: false },
    ],
  },
  {
    id: "01J8ZA",
    name: "New Hire Onboarding",
    temporary: true,
    is_active: false,
    activations: [
      {
        id: "01J8ZA-a1",
        active_type: "days",
        recurring: false,
        days_of_week: [1, 2, 3, 4, 5],
        contract: { starts_at: "2026-09-28", ends_at: "2026-10-09" },
      },
    ],
    schedule_list: [
      { start_time: "09:00", end_time: "10:00", activity: "Team intro", enabled: false },
      {
        start_time: "10:00",
        end_time: "12:00",
        activity: "Systems training",
        enabled: false,
      },
    ],
  },
  {
    id: undefined,
    name: "",
    temporary: true,
    is_active: true,
    activations: [
      {
        id: "draft2-a1",
        active_type: "days",
        recurring: false,
        days_of_week: [2, 3],
        contract: { starts_at: "2026-09-08", ends_at: "2026-09-16" },
      },
    ],
    schedule_list: [
      { start_time: "14:00", end_time: "16:00", activity: "Deep work", enabled: false },
    ],
  },
  {
    id: "01J8ZB",
    name: "Sunday Meal Prep",
    temporary: false,
    is_active: false,
    activations: [
      { id: "01J8ZB-a1", active_type: "days", recurring: true, days_of_week: [0] },
    ],
    schedule_list: [
      {
        start_time: "16:00",
        end_time: "18:00",
        activity: "Cook for the week",
        enabled: false,
      },
    ],
  },
  {
    // Fills every activation slot at once: a recurring weekly pattern, a
    // temporary non-recurring override window on top of it, AND a one-off
    // makeup date — the max-capacity case (2 days-type + N dates).
    id: "01J8ZC",
    name: "Standup Rotation",
    temporary: false,
    is_active: true,
    activations: [
      {
        id: "01J8ZC-a1",
        active_type: "days",
        recurring: true,
        days_of_week: [1, 2, 3, 4, 5],
      },
      {
        id: "01J8ZC-a2",
        active_type: "days",
        recurring: false,
        days_of_week: [2, 4],
        contract: { starts_at: "2026-09-15", ends_at: "2026-09-19" },
      },
      {
        id: "01J8ZC-a3",
        active_type: "date",
        recurring: false,
        specific_date: "2026-09-25",
        contract: { starts_at: "2026-09-25", ends_at: "2026-09-25" },
      },
    ],
    schedule_list: [
      {
        start_time: "09:15",
        end_time: "09:30",
        activity: "Daily standup",
        enabled: false,
      },
    ],
  },
  {
    // Five separate date activations, no days-type at all — stress-tests
    // the "nearest upcoming + N more" collapse on the card.
    id: "01J8ZD",
    name: "Volunteer Shifts",
    temporary: true,
    is_active: true,
    activations: [
      {
        id: "01J8ZD-a1",
        active_type: "date",
        recurring: false,
        specific_date: "2026-09-06",
        contract: { starts_at: "2026-09-06", ends_at: "2026-09-06" },
      },
      {
        id: "01J8ZD-a2",
        active_type: "date",
        recurring: false,
        specific_date: "2026-09-13",
        contract: { starts_at: "2026-09-13", ends_at: "2026-09-13" },
      },
      {
        id: "01J8ZD-a3",
        active_type: "date",
        recurring: false,
        specific_date: "2026-09-20",
        contract: { starts_at: "2026-09-20", ends_at: "2026-09-20" },
      },
      {
        id: "01J8ZD-a4",
        active_type: "date",
        recurring: false,
        specific_date: "2026-09-27",
        contract: { starts_at: "2026-09-27", ends_at: "2026-09-27" },
      },
      {
        id: "01J8ZD-a5",
        active_type: "date",
        recurring: false,
        specific_date: "2026-10-04",
        contract: { starts_at: "2026-10-04", ends_at: "2026-10-04" },
      },
    ],
    schedule_list: [
      {
        start_time: "10:00",
        end_time: "14:00",
        activity: "Food bank shift",
        enabled: false,
      },
    ],
  },
];
// ---------------------------------------------------------------------------
// Search & filter types
// ---------------------------------------------------------------------------
type StatusFilter = "all" | "active" | "inactive";
type MoreFacet = "unsaved" | "recurring" | "one_time" | "days_type" | "date_type";

const MORE_FACET_OPTIONS: { key: MoreFacet; label: string }[] = [
  { key: "unsaved", label: "Unsaved" },
  { key: "recurring", label: "Recurring" },
  { key: "one_time", label: "One-time" },
  { key: "days_type", label: "Days type" },
  { key: "date_type", label: "Date type" },
];

// A schedule can now hold several activations at once, so a facet matches
// if ANY activation on the schedule satisfies it (e.g. "Recurring" matches
// a schedule that has a recurring days pattern even if it also has several
// one-off dates alongside it).
function matchesMoreFacet(schedule: MockSchedule, facet: MoreFacet): boolean {
  switch (facet) {
    case "unsaved":
      return !schedule.id;
    case "recurring":
      return schedule.activations.some((a) => a.recurring);
    case "one_time":
      return schedule.activations.some((a) => !a.recurring);
    case "days_type":
      return schedule.activations.some((a) => a.active_type === "days");
    case "date_type":
      return schedule.activations.some((a) => a.active_type === "date");
  }
}

function displayName(schedule: MockSchedule): string {
  return schedule.name.trim() || "Untitled Schedule";
}

// Picks which date-activation "leads" the card: the nearest upcoming one if
// there is one, otherwise the earliest overall (e.g. all of them already
// passed). Everything else just becomes a "+N more" count rather than
// listing every date inline — with unlimited date activations now allowed,
// showing them all would make a card's height unbounded.
function pickLeadDateActivation(
  dateActivations: Activation[],
): { lead: Activation; remaining: number } | null {
  if (dateActivations.length === 0) return null;
  const sorted = [...dateActivations].sort((a, b) =>
    (a.specific_date ?? "").localeCompare(b.specific_date ?? ""),
  );
  const upcoming = sorted.find((a) => (a.specific_date ?? "") >= TODAY);
  return { lead: upcoming ?? sorted[0], remaining: sorted.length - 1 };
}

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
  const name = displayName(schedule);

  if (!schedule.is_active) {
    return (
      <Pressable
        onPress={() => onPress(schedule)}
        style={({ pressed }) => [s.card, s.cardRow, pressed && s.cardPressed]}
      >
        <Text style={s.cardTitle}>{name}</Text>
        <ChevronRight size={18} color={colors.textMuted} />
      </Pressable>
    );
  }

  const daysActivations = schedule.activations.filter((a) => a.active_type === "days");
  const dateActivations = schedule.activations.filter(
    (a) => a.active_type === "date" && a.specific_date,
  );
  const leadDate = pickLeadDateActivation(dateActivations);

  return (
    <Pressable
      onPress={() => onPress(schedule)}
      style={({ pressed }) => [s.card, s.cardActive, pressed && s.cardPressed]}
    >
      <View style={s.cardHeaderRow}>
        <Text style={isSaved ? s.cardTitle : s.namePlaceholderTitle}>{name}</Text>
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

      {/* One block per days-type activation — at most 2 (one recurring,
          one non-recurring), so this never needs collapsing. */}
      {daysActivations.length > 0 && (
        <View style={s.activationBlocks}>
          {daysActivations.map((act) => (
            <View key={act.id} style={s.activationBlock}>
              <View style={s.badgeRow}>
                <View style={s.badge}>
                  <Text style={s.badgeText}>Days</Text>
                </View>
                <View style={s.badge}>
                  <Text style={s.badgeText}>
                    {act.recurring ? "Recurring · Weekly" : "One-time"}
                  </Text>
                </View>
              </View>
              {(act.days_of_week?.length ?? 0) > 0 && (
                <DayChips activeDays={act.days_of_week ?? []} />
              )}
              {act.contract && (
                <Text style={s.contractText}>{formatContractRange(act.contract)}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Date-type activations collapse to the nearest upcoming one plus a
          count, since there can be any number of them. */}
      {leadDate && (
        <View style={s.badgeRow}>
          <View style={s.badge}>
            <Text style={s.badgeText}>Date</Text>
          </View>
          <Text style={s.contractText}>
            {formatDate(leadDate.lead.specific_date as string)}
            {leadDate.remaining > 0 ? `  +${leadDate.remaining} more` : ""}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Search + filter bar
// ---------------------------------------------------------------------------
function SearchFilterBar({
  query,
  onQueryChange,
  statusFilter,
  onStatusChange,
  untitledOnly,
  onToggleUntitled,
  moreFacets,
  onToggleMoreFacet,
  moreOpen,
  onToggleMoreOpen,
  onClearAll,
  hasActiveFilters,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  untitledOnly: boolean;
  onToggleUntitled: () => void;
  moreFacets: Set<MoreFacet>;
  onToggleMoreFacet: (f: MoreFacet) => void;
  moreOpen: boolean;
  onToggleMoreOpen: () => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}) {
  const s = useSStyles();
  const { colors } = useTheme();

  return (
    <View style={s.searchArea}>
      <View style={s.searchInputRow}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search schedules"
          placeholderTextColor={colors.textMuted}
          style={s.searchInput}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => onQueryChange("")} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.segmentRow}>
        {(["all", "active", "inactive"] as StatusFilter[]).map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => onStatusChange(opt)}
            style={[s.segment, statusFilter === opt && s.segmentActive]}
          >
            <Text style={[s.segmentText, statusFilter === opt && s.segmentTextActive]}>
              {opt === "all" ? "All" : opt === "active" ? "Active" : "Inactive"}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={s.segmentDivider} />

        <TouchableOpacity
          onPress={onToggleUntitled}
          style={[s.segment, untitledOnly && s.segmentActive]}
        >
          <Text style={[s.segmentText, untitledOnly && s.segmentTextActive]}>
            Untitled
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onToggleMoreOpen} style={s.moreBtn} hitSlop={6}>
          <Text style={s.moreBtnText}>More filters</Text>
          <Ionicons
            name={moreOpen ? "chevron-up" : "chevron-down"}
            size={13}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {moreOpen && (
        <View style={s.facetRow}>
          {MORE_FACET_OPTIONS.map(({ key, label }) => {
            const on = moreFacets.has(key);
            return (
              <TouchableOpacity
                key={key}
                onPress={() => onToggleMoreFacet(key)}
                style={[s.facetChip, on && s.facetChipActive]}
              >
                <Text style={[s.facetChipText, on && s.facetChipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {hasActiveFilters && (
        <TouchableOpacity onPress={onClearAll} hitSlop={6} style={s.clearFiltersBtn}>
          <Ionicons name="close" size={12} color={colors.accent} />
          <Text style={s.clearFiltersText}>Clear filters</Text>
        </TouchableOpacity>
      )}
    </View>
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

  // --- search & filter state ---
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [untitledOnly, setUntitledOnly] = useState(false);
  const [moreFacets, setMoreFacets] = useState<Set<MoreFacet>>(new Set());
  const [moreOpen, setMoreOpen] = useState(false);

  // --- week overview modal ---
  const [weekModalVisible, setWeekModalVisible] = useState(false);

  const toggleMoreFacet = useCallback((facet: MoreFacet) => {
    setMoreFacets((prev) => {
      const next = new Set(prev);
      if (next.has(facet)) {
        next.delete(facet);
      } else {
        next.add(facet);
      }
      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setQuery("");
    setStatusFilter("all");
    setUntitledOnly(false);
    setMoreFacets(new Set());
  }, []);

  const hasActiveFilters =
    query.trim().length > 0 ||
    statusFilter !== "all" ||
    untitledOnly ||
    moreFacets.size > 0;

  const filteredSchedules = useMemo(() => {
    const q = query.trim().toLowerCase();

    return schedules.filter((sch) => {
      if (statusFilter === "active" && !sch.is_active) return false;
      if (statusFilter === "inactive" && sch.is_active) return false;

      if (untitledOnly && sch.name.trim().length > 0) return false;

      if (q && !displayName(sch).toLowerCase().includes(q)) return false;

      for (const facet of moreFacets) {
        if (!matchesMoreFacet(sch, facet)) return false;
      }

      return true;
    });
  }, [schedules, query, statusFilter, untitledOnly, moreFacets]);

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

  // Flips the singleton is_active flag: the selected schedule becomes the
  // one active schedule, every other schedule turns off. Independent of
  // activation configuration — a schedule can be set active with zero
  // activations, then have them added afterward via onConfigureActivation.
  const handleSetActive = useCallback(() => {
    if (selectedIndex === null) return;
    setSchedules((prev) =>
      prev.map((sch, idx) => ({ ...sch, is_active: idx === selectedIndex })),
    );
    // TODO: persist the active-schedule change to backend.
  }, [selectedIndex]);

  // Adding or editing an activation requires the SetActiveModal UI (date
  // pickers, recurring toggle, etc.) that isn't part of these two files —
  // wire this up to that flow. On save there, upsert into
  // schedules[selectedIndex].activations, respecting canAddActivation() for
  // the "add" case.
  const handleConfigureActivation = useCallback((_intent: ActivationIntent) => {
    throw new Error("Function not implemented.");
  }, []);

  const handleDeleteActivation = useCallback(
    (activationId: string) => {
      if (selectedIndex === null) return;
      setSchedules((prev) =>
        prev.map((sch, idx) =>
          idx === selectedIndex
            ? {
                ...sch,
                activations: sch.activations.filter((a) => a.id !== activationId),
              }
            : sch,
        ),
      );
    },
    [selectedIndex],
  );

  const handleDeleteActivations = useCallback(
    (activationIds: string[]) => {
      if (selectedIndex === null) return;
      const idSet = new Set(activationIds);
      setSchedules((prev) =>
        prev.map((sch, idx) =>
          idx === selectedIndex
            ? { ...sch, activations: sch.activations.filter((a) => !idSet.has(a.id)) }
            : sch,
        ),
      );
    },
    [selectedIndex],
  );

  const activationInput: ActivationScheduleInput | null = selected
    ? {
        id: selected.id,
        name: selected.name,
        schedule_list: selected.schedule_list,
        activations: selected.activations,
      }
    : null;

  const aiGenerateTest = async () => {};

  const toggleSearchOpen = useCallback(() => {
    setSearchOpen((prev) => {
      const next = !prev;
      if (!next) {
        // Closing the search area clears filters so the list returns to
        // its default state instead of silently staying filtered offscreen.
        clearAllFilters();
        setMoreOpen(false);
      }
      return next;
    });
  }, [clearAllFilters]);

  return (
    <View style={s.root}>
      <AppHeader
        right={
          <>
            <HeaderIconButton
              icon="calendar-outline"
              onPress={() => setWeekModalVisible(true)}
            />
            <HeaderIconButton
              icon={searchOpen ? "close" : "search-outline"}
              onPress={toggleSearchOpen}
            />
            <HeaderIconButton
              icon="add"
              iconSize={22}
              accent
              onPress={() => router.push("/schedule/add")}
            />
          </>
        }
      />

      {searchOpen && (
        <SearchFilterBar
          query={query}
          onQueryChange={setQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          untitledOnly={untitledOnly}
          onToggleUntitled={() => setUntitledOnly((v) => !v)}
          moreFacets={moreFacets}
          onToggleMoreFacet={toggleMoreFacet}
          moreOpen={moreOpen}
          onToggleMoreOpen={() => setMoreOpen((v) => !v)}
          onClearAll={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {schedules.length === 0 ? (
        <View style={s.body}>
          <Text style={s.label}>Schedules</Text>
          <Text style={s.sub}>Your saved schedules will appear here.</Text>
        </View>
      ) : filteredSchedules.length === 0 ? (
        <View style={s.body}>
          <Text style={s.label}>No matches</Text>
          <Text style={s.sub}>Try a different search or adjust your filters.</Text>
          {hasActiveFilters && (
            <TouchableOpacity onPress={clearAllFilters} style={s.emptyClearBtn}>
              <Text style={s.clearFiltersText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredSchedules}
          keyExtractor={(item, idx) => item.id ?? `draft-${idx}`}
          contentContainerStyle={s.listContent}
          keyboardShouldPersistTaps="handled"
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
        onRename={handleRename}
        onSetActive={handleSetActive}
        onConfigureActivation={handleConfigureActivation}
        onDeleteActivation={handleDeleteActivation}
        onDeleteActivations={handleDeleteActivations}
        onDelete={(): void => {
          throw new Error("Function not implemented.");
        }}
      />

      <WeekActiveSchedulesModal
        visible={weekModalVisible}
        onClose={() => setWeekModalVisible(false)}
        schedules={schedules}
        onOpenSchedule={(sch) => {
          setWeekModalVisible(false);
          handleOpenSchedule(sch as MockSchedule);
        }}
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
        activationBlocks: { gap: 10 },
        activationBlock: { gap: 8 },
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

        // --- search / filter bar ---
        searchArea: {
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: 12,
          gap: 10,
        },
        searchInputRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: colors.bgElevated,
          borderRadius: Radius.lg,
          paddingHorizontal: 12,
          height: 40,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        searchInput: {
          flex: 1,
          fontSize: 14,
          fontFamily: FontFamily.body,
          color: colors.textPrimary,
          paddingVertical: 0,
        },
        segmentRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        },
        segment: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: Radius.full,
          backgroundColor: colors.bgElevated,
        },
        segmentActive: { backgroundColor: colors.accent },
        segmentText: {
          fontSize: 12,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.textMuted,
        },
        segmentTextActive: { color: colors.white },
        segmentDivider: {
          width: StyleSheet.hairlineWidth,
          height: 16,
          backgroundColor: colors.border,
        },
        moreBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: 3,
          paddingHorizontal: 4,
          paddingVertical: 6,
          marginLeft: "auto",
        },
        moreBtnText: {
          fontSize: 12,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.textMuted,
        },
        facetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        facetChip: {
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: Radius.full,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor: colors.bgCard,
        },
        facetChipActive: {
          backgroundColor: colors.accentSoft,
          borderColor: colors.accent,
        },
        facetChipText: {
          fontSize: 11,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.textMuted,
        },
        facetChipTextActive: { color: colors.accent },
        clearFiltersBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          alignSelf: "flex-start",
        },
        clearFiltersText: {
          fontSize: 12,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.accent,
        },
        emptyClearBtn: { marginTop: 4 },
      }),
    [colors],
  );
}
