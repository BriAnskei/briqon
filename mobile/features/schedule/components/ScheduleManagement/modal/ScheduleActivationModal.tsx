import { Check, Pencil, Plus, Trash2, X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import type { ScheduleItem } from "@/src/models/schedule.model";
import type { SubSummary } from "@/src/models/sub_summaries.model";
import type { ScheduleSummary } from "@/src/models/summaries.model";
import { ComponentSize, FontFamily, Radius } from "@/type/theme";
import { ScheduleTimeline } from "../../GenerateScheduleScreen/components/ScheduleTimeline";
import { SummaryCard } from "../../GenerateScheduleScreen/components/SummaryCard";

// ---------------------------------------------------------------------------
// Activation types
//
// Modeled after the iCalendar RRULE/RDATE relationship: a schedule can hold
// at most one recurring "days" activation and at most one non-recurring
// "days" activation (each is a single pattern/window, so a second one would
// just conflict with the first), plus an unbounded list of one-off "date"
// activations layered on top (each is its own independent instance, the
// same way RDATE entries stack onto an RRULE without limit).
// ---------------------------------------------------------------------------
export type ActiveType = "days" | "date";

export interface Contract {
  starts_at: string;
  ends_at: string;
}

export interface Activation {
  id: string;
  active_type: ActiveType;
  /** Only ever true for active_type === "days" — a "date" activation is
   * inherently a single, non-recurring instance. */
  recurring: boolean;
  days_of_week?: number[]; // active_type === "days"
  specific_date?: string; // active_type === "date"
  /** Validity window for this specific activation. Absent when recurring
   * (a weekly pattern repeats indefinitely, so it has no window). */
  contract?: Contract;
}

export type ActivationIntent =
  | { mode: "add"; active_type: ActiveType; recurring: boolean }
  | { mode: "edit"; activation: Activation };

/**
 * Enforces the multiplicity rules described above. "date" activations are
 * always addable; a "days" activation (recurring or not) can only be added
 * if one of that same recurring-ness doesn't already exist on the schedule.
 */
export function canAddActivation(
  activations: Activation[],
  candidate: { active_type: ActiveType; recurring: boolean },
): boolean {
  if (candidate.active_type === "date") return true;
  return !activations.some(
    (a) => a.active_type === "days" && a.recurring === candidate.recurring,
  );
}

export interface ActivationScheduleInput {
  id?: string; // undefined => not saved yet
  name: string; // "" allowed for unsaved drafts
  schedule_list: ScheduleItem[];
  activations: Activation[];
  /**
   * Indexes into `schedule_list` that are currently turned off. Optional —
   * absent/empty means every item is active. Seeds the edit-mode toggle
   * state; persistence of this is up to the caller (see onSaveEdits).
   */
  disabledItemIndexes?: number[];
}

export interface ScheduleEditPayload {
  name: string;
  disabledItemIndexes: number[];
}

// ---------------------------------------------------------------------------
// Small date helpers (kept local/duplicated rather than imported from the
// screen, since the screen already imports from this file — importing back
// would create a cycle. Worth hoisting into a shared `utils/schedule.ts` if
// a third consumer shows up.)
// ---------------------------------------------------------------------------
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

interface ScheduleActivationModalProps {
  visible: boolean;
  onClose: () => void;
  schedule: ActivationScheduleInput | null;
  isActive: boolean;
  onSave: () => void;
  onRename: (name: string) => void;
  /**
   * Commits an edit-mode session: the (possibly changed) name and the set
   * of item indexes the user turned off. Called once, when the user taps
   * Save in edit mode — not on every keystroke/toggle.
   */
  onSaveEdits?: (payload: ScheduleEditPayload) => void;
  /**
   * Marks this schedule as THE currently active one (a singleton flag —
   * the caller is expected to flip every other schedule's is_active to
   * false at the same time). Deliberately separate from
   * onConfigureActivation: "which schedule is active" and "when an active
   * schedule's activations fire" are independent concerns.
   */
  onSetActive: () => void;
  /**
   * Opens the activation-configuration flow (SetActiveModal) for either
   * adding a brand-new activation or editing an existing one — the intent
   * tells the caller which, and with what to seed the form.
   */
  onConfigureActivation: (intent: ActivationIntent) => void;
  /**
   * Removes a single activation from this schedule (not the whole
   * schedule). The confirm step is handled here; the caller implements
   * the actual removal.
   */
  onDeleteActivation: (activationId: string) => void;
  /**
   * Removes several activations at once — the long-press multi-select
   * flow. The confirm step is handled here; the caller implements the
   * actual removal.
   */
  onDeleteActivations: (activationIds: string[]) => void;
  /**
   * Permanently removes this schedule (and all of its activations).
   * Always rendered regardless of save state — the confirm step (native
   * destructive Alert) is handled here; the caller implements the actual
   * deletion.
   */
  onDelete: () => void;
}

function buildMockSummary(schedule_list: ScheduleItem[]): {
  summaries: ScheduleSummary[];
  subSummaries: SubSummary[];
} {
  const summaryId = "mock-cat-1";
  const summaries = [
    { id: summaryId, name: "Activities", total: `${schedule_list.length}` },
  ] as unknown as ScheduleSummary[];
  const subSummaries = schedule_list.map((item, idx) => ({
    id: `mock-sub-${idx}`,
    summary_id: summaryId,
    name: item.activity,
    total: `${item.start_time}–${item.end_time}`,
  })) as unknown as SubSummary[];
  return { summaries, subSummaries };
}

// ---------------------------------------------------------------------------
// Single activation row (inside the Activations section)
// ---------------------------------------------------------------------------
function ActivationRow({
  activation,
  onEdit,
  onDelete,
  selectionMode,
  isSelected,
  onToggleSelect,
  onLongPress,
}: {
  activation: Activation;
  onEdit: () => void;
  onDelete: () => void;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onLongPress: () => void;
}) {
  const s = useSStyles();
  const { colors } = useTheme();

  const activeDays =
    activation.active_type === "days" ? (activation.days_of_week ?? []) : [];

  return (
    <Pressable
      onLongPress={onLongPress}
      onPress={selectionMode ? onToggleSelect : undefined}
      style={[s.activationRow, selectionMode && isSelected && s.activationRowSelected]}
    >
      {selectionMode && (
        <View style={[s.selectCircle, isSelected && s.selectCircleActive]}>
          {isSelected && <Check size={12} color={colors.white} />}
        </View>
      )}
      <View style={s.activationRowMain}>
        <View style={s.badgeRow}>
          <View style={s.typeBadge}>
            <Text style={s.typeBadgeText}>
              {activation.active_type === "days" ? "Days" : "Date"}
            </Text>
          </View>
          <View style={s.typeBadge}>
            <Text style={s.typeBadgeText}>
              {activation.recurring ? "Recurring · Weekly" : "One-time"}
            </Text>
          </View>
        </View>

        {activation.active_type === "days" && activeDays.length > 0 && (
          <View style={s.dayChipRow}>
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
        )}

        {activation.active_type === "date" && activation.specific_date && (
          <Text style={s.activationDateText}>{formatDate(activation.specific_date)}</Text>
        )}

        {activation.contract && (
          <Text style={s.activationContractText}>
            {formatContractRange(activation.contract)}
          </Text>
        )}
      </View>

      {!selectionMode && (
        <View style={s.activationRowActions}>
          <Pressable onPress={onEdit} hitSlop={8} style={s.activationIconBtn}>
            <Pencil size={14} color={colors.textSecondary} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8} style={s.activationIconBtn}>
            <Trash2 size={14} color={colors.danger ?? "#E5484D"} />
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Add-activation button (disabled once its slot is filled, for the
// days/recurring and days/non-recurring cases)
// ---------------------------------------------------------------------------
function AddActivationButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const s = useSStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[s.addActivationBtn, disabled && s.addActivationBtnDisabled]}
    >
      <Plus size={13} color={disabled ? colors.textMuted : colors.accent} />
      <Text style={[s.addActivationBtnText, disabled && s.addActivationBtnTextDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ScheduleActivationModal({
  visible,
  onClose,
  schedule,
  isActive,
  onSave,
  onRename,
  onSaveEdits,
  onSetActive,
  onConfigureActivation,
  onDeleteActivation,
  onDeleteActivations,
  onDelete,
}: ScheduleActivationModalProps) {
  // --- All hooks run unconditionally, every render, regardless of whether
  // `schedule` is null. Never put a hook after an early return. ---
  const s = useSStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [nameDraft, setNameDraft] = useState(schedule?.name ?? "");

  // Edit mode: renaming + toggling items is an explicit, committed session
  // (Cancel discards, Save commits both together) rather than always-on
  // inline editing — this avoids the keyboard popping up or a name
  // half-changing just because someone tapped a toggle.
  const [isEditing, setIsEditing] = useState(false);
  const [disabledIndexes, setDisabledIndexes] = useState<Set<number>>(new Set());

  // Multi-select for bulk-deleting activations: long-press a row to enter,
  // tap others to add/remove, a bottom bar handles Select All / Delete
  // (the standard Android/Material contextual-action-bar pattern).
  const [activationSelectionMode, setActivationSelectionMode] = useState(false);
  const [selectedActivationIds, setSelectedActivationIds] = useState<Set<string>>(
    new Set(),
  );
  const [addActivationMenuOpen, setAddActivationMenuOpen] = useState(false);

  // Resync local edit state whenever a different schedule is opened
  // (previously this only ran once via useState's initializer, so reopening
  // the modal on a different schedule would show stale text). Also bails
  // out of any in-progress edit session so stale drafts never leak across
  // schedules.
  useEffect(() => {
    setNameDraft(schedule?.name ?? "");
    setDisabledIndexes(new Set(schedule?.disabledItemIndexes ?? []));
    setIsEditing(false);
    setActivationSelectionMode(false);
    setSelectedActivationIds(new Set());
    setAddActivationMenuOpen(false);
  }, [schedule?.id, schedule?.name, schedule?.disabledItemIndexes]);

  // Also drop out of activation-selection mode whenever the sheet closes,
  // so reopening it never resumes mid-selection.
  useEffect(() => {
    if (!visible) {
      setActivationSelectionMode(false);
      setSelectedActivationIds(new Set());
      setAddActivationMenuOpen(false);
    }
  }, [visible]);

  const { summaries, subSummaries } = useMemo(
    () => buildMockSummary(schedule?.schedule_list ?? []),
    [schedule?.schedule_list],
  );

  // Guard AFTER all hooks have been called.
  if (!schedule) return null;

  const isSaved = !!schedule.id;
  const displayName = schedule.name || "Untitled Schedule";
  const activeCount = schedule.schedule_list.length - disabledIndexes.size;

  const handleDeletePress = () => {
    // Native destructive confirmation — required before any irreversible
    // action, per RN Alert conventions (explicit Cancel, destructive style).
    // Copy is deliberately the same regardless of save state or how many
    // activations exist — deleting always drops all of them together.
    Alert.alert(
      "Delete Schedule",
      `"${displayName}" will be permanently deleted${
        isActive ? ", including its activations" : ""
      }. This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: onDelete, // caller implements the actual deletion
        },
      ],
    );
  };

  const handleDeleteActivationPress = (activation: Activation) => {
    const label =
      activation.active_type === "days"
        ? activation.recurring
          ? "the recurring days activation"
          : "the one-time days activation"
        : activation.specific_date
          ? `the ${formatDate(activation.specific_date)} activation`
          : "this activation";

    Alert.alert("Remove Activation", `Remove ${label}? This can't be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => onDeleteActivation(activation.id),
      },
    ]);
  };

  const handleActivationLongPress = (activation: Activation) => {
    setActivationSelectionMode(true);
    setSelectedActivationIds(new Set([activation.id]));
    setAddActivationMenuOpen(false);
  };

  const handleToggleActivationSelected = (activationId: string) => {
    setSelectedActivationIds((prev) => {
      const next = new Set(prev);
      if (next.has(activationId)) {
        next.delete(activationId);
      } else {
        next.add(activationId);
      }
      // Selecting the last remaining item back out of existence exits
      // selection mode entirely, matching the CAB convention of
      // auto-dismissing once nothing is selected.
      if (next.size === 0) setActivationSelectionMode(false);
      return next;
    });
  };

  const handleSelectAllActivations = () => {
    if (!schedule) return;
    const allIds = schedule.activations.map((a) => a.id);
    const allSelected = selectedActivationIds.size === allIds.length;
    setSelectedActivationIds(allSelected ? new Set() : new Set(allIds));
  };

  const handleCancelActivationSelection = () => {
    setActivationSelectionMode(false);
    setSelectedActivationIds(new Set());
  };

  const handleBulkDeleteActivationsPress = () => {
    const count = selectedActivationIds.size;
    if (count === 0) return;
    Alert.alert(
      "Remove Activations",
      `Remove ${count} activation${count === 1 ? "" : "s"}? This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            onDeleteActivations(Array.from(selectedActivationIds));
            setActivationSelectionMode(false);
            setSelectedActivationIds(new Set());
          },
        },
      ],
    );
  };

  const handleStartEdit = () => {
    setNameDraft(schedule.name);
    setDisabledIndexes(new Set(schedule.disabledItemIndexes ?? []));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Discard: revert local drafts back to the schedule's last known state.
    setNameDraft(schedule.name);
    setDisabledIndexes(new Set(schedule.disabledItemIndexes ?? []));
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    onRename(nameDraft);
    onSaveEdits?.({ name: nameDraft, disabledItemIndexes: Array.from(disabledIndexes) });
    setIsEditing(false);
  };

  const toggleItemIndex = (idx: number) => {
    setDisabledIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={isEditing ? handleCancelEdit : onClose}
    >
      <View style={s.backdrop}>
        <Pressable
          style={s.backdropPress}
          onPress={isEditing ? handleCancelEdit : onClose}
        />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          {/* Header */}
          {isEditing ? (
            // Edit-mode header: Cancel/Save replace the normal name+close
            // chrome entirely (iOS convention — a Save/Done control always
            // sits top-right, and Cancel moves to top-left once paired with
            // it), so there's no ambiguity about what tapping X would do
            // to unsaved changes.
            <View style={s.editHeader}>
              <Pressable onPress={handleCancelEdit} hitSlop={8}>
                <Text style={s.editHeaderCancel}>Cancel</Text>
              </Pressable>
              <Text style={s.editHeaderTitle}>Edit Schedule</Text>
              <Pressable onPress={handleSaveEdit} hitSlop={8} style={s.editHeaderSaveBtn}>
                <Check size={14} color={colors.white} />
                <Text style={s.editHeaderSaveText}>Save</Text>
              </Pressable>
            </View>
          ) : (
            <View style={s.sheetHeader}>
              <View style={s.nameGroup}>
                <Text style={isSaved ? s.nameText : s.namePlaceholder}>
                  {displayName}
                </Text>
                <View style={s.tagRow}>
                  {!isSaved && (
                    <View style={s.unsavedTag}>
                      <Text style={s.unsavedTagText}>Unsaved</Text>
                    </View>
                  )}
                  {isActive && (
                    <View style={s.activeTag}>
                      <View style={s.activeDot} />
                      <Text style={s.activeTagText}>Active</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={s.headerIconGroup}>
                <Pressable onPress={handleStartEdit} hitSlop={8} style={s.headerIconBtn}>
                  <Pencil size={18} color={colors.textSecondary} />
                </Pressable>
                <Pressable onPress={onClose} hitSlop={8} style={s.headerIconBtn}>
                  <X size={22} color={colors.textMuted} />
                </Pressable>
              </View>
            </View>
          )}

          {/* Body */}
          {isEditing ? (
            <ScrollView
              style={s.body}
              contentContainerStyle={s.bodyContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View>
                <Text style={s.editFieldLabel}>Name</Text>
                <TextInput
                  style={s.editNameInput}
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  placeholder="Schedule name"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                />
              </View>

              <View>
                <View style={s.editFieldLabelRow}>
                  <Text style={s.editFieldLabel}>Activities</Text>
                  <Text style={s.editFieldCount}>
                    {activeCount} of {schedule.schedule_list.length} active
                  </Text>
                </View>
                <View style={s.editItemList}>
                  {schedule.schedule_list.map((item, idx) => {
                    const disabled = disabledIndexes.has(idx);
                    return (
                      <View
                        key={idx}
                        style={[s.editItemRow, disabled && s.editItemRowDisabled]}
                      >
                        <View style={s.editItemTextGroup}>
                          <Text
                            style={[s.editItemTime, disabled && s.editItemTextDisabled]}
                          >
                            {item.start_time}–{item.end_time}
                          </Text>
                          <Text
                            style={[
                              s.editItemActivity,
                              disabled && s.editItemTextDisabled,
                              disabled && s.editItemTextStrike,
                            ]}
                          >
                            {item.activity}
                          </Text>
                        </View>
                        <Switch
                          value={!disabled}
                          onValueChange={() => toggleItemIndex(idx)}
                          trackColor={{ false: colors.bgElevated, true: colors.accent }}
                          thumbColor={colors.white}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          ) : (
            <ScrollView
              style={s.body}
              contentContainerStyle={s.bodyContent}
              showsVerticalScrollIndicator={false}
            >
              <SummaryCard summaries={summaries} subSummaries={subSummaries} />
              <ScheduleTimeline schedule={schedule.schedule_list} />

              {/* Activations management — only shown for the schedule that
                  is currently the active one, mirroring the original gating
                  on the (now-removed) single "Edit Activation" button. */}
              {isActive && (
                <View style={s.activationsSection}>
                  <View style={s.activationsSectionHeader}>
                    <Text style={s.editFieldLabel}>Activations</Text>
                    {schedule.activations.length > 0 && (
                      <Text style={s.editFieldCount}>{schedule.activations.length}</Text>
                    )}
                  </View>

                  {schedule.activations.length === 0 ? (
                    <Text style={s.activationsEmptyText}>
                      No activation configured yet — add one below.
                    </Text>
                  ) : (
                    <View style={s.activationsList}>
                      {schedule.activations.map((act) => (
                        <ActivationRow
                          key={act.id}
                          activation={act}
                          onEdit={() =>
                            onConfigureActivation({ mode: "edit", activation: act })
                          }
                          onDelete={() => handleDeleteActivationPress(act)}
                          selectionMode={activationSelectionMode}
                          isSelected={selectedActivationIds.has(act.id)}
                          onToggleSelect={() => handleToggleActivationSelected(act.id)}
                          onLongPress={() => handleActivationLongPress(act)}
                        />
                      ))}
                    </View>
                  )}

                  {activationSelectionMode ? (
                    // Contextual action bar — replaces the add-activation
                    // row while one or more activations are selected for
                    // bulk removal.
                    <View style={s.selectionBar}>
                      <Pressable onPress={handleCancelActivationSelection} hitSlop={8}>
                        <Text style={s.selectionBarCancel}>Cancel</Text>
                      </Pressable>
                      <Text style={s.selectionBarCount}>
                        {selectedActivationIds.size} selected
                      </Text>
                      <View style={s.selectionBarActions}>
                        <Pressable onPress={handleSelectAllActivations} hitSlop={8}>
                          <Text style={s.selectionBarAction}>
                            {selectedActivationIds.size === schedule.activations.length
                              ? "Deselect All"
                              : "Select All"}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={handleBulkDeleteActivationsPress}
                          disabled={selectedActivationIds.size === 0}
                          hitSlop={8}
                          style={[
                            s.selectionBarDeleteBtn,
                            selectedActivationIds.size === 0 &&
                              s.selectionBarDeleteBtnDisabled,
                          ]}
                        >
                          <Trash2 size={13} color={colors.white} />
                          <Text style={s.selectionBarDeleteText}>Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View style={s.addActivationRow}>
                      <AddActivationButton
                        label="Add Activation"
                        disabled={false}
                        onPress={() => setAddActivationMenuOpen((v) => !v)}
                      />
                    </View>
                  )}

                  {!activationSelectionMode && addActivationMenuOpen && (
                    <View style={s.addActivationMenu}>
                      {(
                        [
                          {
                            label: "Recurring Days",
                            sub: "Repeats weekly",
                            active_type: "days" as const,
                            recurring: true,
                          },
                          {
                            label: "One-time Days",
                            sub: "A single day-of-week window",
                            active_type: "days" as const,
                            recurring: false,
                          },
                          {
                            label: "Specific Date",
                            sub: "Add another one-off date",
                            active_type: "date" as const,
                            recurring: false,
                          },
                        ] as const
                      ).map((opt, idx, arr) => {
                        const disabled = !canAddActivation(schedule.activations, {
                          active_type: opt.active_type,
                          recurring: opt.recurring,
                        });
                        const isLast = idx === arr.length - 1;
                        return (
                          <Pressable
                            key={opt.label}
                            disabled={disabled}
                            onPress={() => {
                              setAddActivationMenuOpen(false);
                              onConfigureActivation({
                                mode: "add",
                                active_type: opt.active_type,
                                recurring: opt.recurring,
                              });
                            }}
                            style={[
                              s.addActivationMenuItem,
                              isLast && s.addActivationMenuItemLast,
                              disabled && s.addActivationMenuItemDisabled,
                            ]}
                          >
                            <View>
                              <Text
                                style={[
                                  s.addActivationMenuItemLabel,
                                  disabled && s.addActivationMenuItemLabelDisabled,
                                ]}
                              >
                                {opt.label}
                              </Text>
                              <Text style={s.addActivationMenuItemSub}>
                                {disabled ? "Already configured" : opt.sub}
                              </Text>
                            </View>
                            <Plus
                              size={14}
                              color={disabled ? colors.textMuted : colors.accent}
                            />
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          )}

          {/* Manage row and primary actions are hidden while editing — the
              edit session has its own committed Save/Cancel above, and
              surfacing Delete alongside an in-progress rename invites
              tapping the wrong thing. */}
          {!isEditing && (
            <>
              <View style={s.manageRow}>
                <Pressable
                  style={[s.manageBtn, s.deleteBtn, s.deleteBtnFull]}
                  onPress={handleDeletePress}
                  hitSlop={6}
                >
                  <Trash2 size={15} color={colors.danger ?? "#E5484D"} />
                  <Text style={[s.manageBtnText, s.deleteBtnText]}>Delete</Text>
                </Pressable>
              </View>

              <View style={s.actionRow}>
                {!isSaved && (
                  <Pressable style={[s.actionBtn, s.saveBtn]} onPress={onSave}>
                    <Text style={s.saveBtnText}>Save Schedule</Text>
                  </Pressable>
                )}
                {!isActive && (
                  <Pressable
                    style={[s.actionBtn, s.activateBtn, !isSaved && s.actionBtnSecondary]}
                    onPress={onSetActive}
                  >
                    <Text
                      style={[s.activateBtnText, !isSaved && s.activateBtnTextSecondary]}
                    >
                      Set as Active
                    </Text>
                  </Pressable>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

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
          marginBottom: 16,
        },
        nameGroup: { flex: 1, gap: 8, marginRight: 12 },
        nameText: {
          fontSize: 18,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
          color: colors.textPrimary,
        },
        namePlaceholder: {
          fontSize: 18,
          fontFamily: FontFamily.body,
          fontWeight: "400",
          fontStyle: "italic",
          color: colors.textMuted,
        },
        headerIconGroup: { flexDirection: "row", alignItems: "center", gap: 4 },
        headerIconBtn: { padding: 2 },
        tagRow: { flexDirection: "row", gap: 8 },
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
        activeTag: { flexDirection: "row", alignItems: "center", gap: 5 },
        activeDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.accent,
        },
        activeTagText: {
          fontSize: 11,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.accent,
        },
        body: { flexGrow: 0 },
        bodyContent: { gap: 16, paddingBottom: 8 },

        // --- edit mode header ---
        editHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        },
        editHeaderCancel: {
          fontSize: 15,
          fontFamily: FontFamily.body,
          fontWeight: "400",
          color: colors.textSecondary,
        },
        editHeaderTitle: {
          fontSize: 15,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
          color: colors.textPrimary,
        },
        editHeaderSaveBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: Radius.full,
          backgroundColor: colors.accent,
        },
        editHeaderSaveText: {
          fontSize: 13,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
          color: colors.white,
        },

        // --- edit mode body ---
        editFieldLabel: {
          fontSize: 12,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.4,
        },
        editFieldLabelRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        },
        editFieldCount: {
          fontSize: 12,
          fontFamily: FontFamily.mono,
          fontWeight: "400",
          color: colors.textMuted,
        },
        editNameInput: {
          fontSize: 16,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.textPrimary,
          backgroundColor: colors.bgElevated,
          borderRadius: Radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        editItemList: {
          borderRadius: Radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          overflow: "hidden",
        },
        editItemRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
          backgroundColor: colors.bgCard,
        },
        editItemRowDisabled: { backgroundColor: colors.bgElevated },
        editItemTextGroup: { flex: 1, gap: 2 },
        editItemTime: {
          fontSize: 12,
          fontFamily: FontFamily.mono,
          fontWeight: "400",
          color: colors.textSecondary,
        },
        editItemActivity: {
          fontSize: 14,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.textPrimary,
        },
        editItemTextDisabled: { color: colors.textMuted },
        editItemTextStrike: { textDecorationLine: "line-through" },

        // --- activations section ---
        activationsSection: {
          gap: 10,
          paddingTop: 14,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        activationsSectionHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        activationsEmptyText: {
          fontSize: 13,
          fontFamily: FontFamily.body,
          fontWeight: "400",
          color: colors.textMuted,
        },
        activationsList: { gap: 8 },
        activationRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
          padding: 12,
          borderRadius: Radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor: colors.bgCard,
        },
        activationRowSelected: {
          borderColor: colors.accent,
          backgroundColor: colors.accentSoft,
        },
        activationRowMain: { flex: 1, gap: 8 },
        activationRowActions: { flexDirection: "row", gap: 4 },
        activationIconBtn: { padding: 4 },
        selectCircle: {
          width: 20,
          height: 20,
          borderRadius: Radius.full,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor: colors.bgElevated,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        },
        selectCircleActive: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
        selectionBar: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: Radius.md,
          backgroundColor: colors.bgElevated,
        },
        selectionBarCancel: {
          fontSize: 13,
          fontFamily: FontFamily.body,
          fontWeight: "400",
          color: colors.textSecondary,
        },
        selectionBarCount: {
          fontSize: 12,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.textMuted,
        },
        selectionBarActions: { flexDirection: "row", alignItems: "center", gap: 14 },
        selectionBarAction: {
          fontSize: 13,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.accent,
        },
        selectionBarDeleteBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: Radius.full,
          backgroundColor: colors.danger ?? "#E5484D",
        },
        selectionBarDeleteBtnDisabled: { opacity: 0.5 },
        selectionBarDeleteText: {
          fontSize: 12,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
          color: colors.white,
        },
        badgeRow: { flexDirection: "row", gap: 8 },
        typeBadge: {
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: Radius.full,
          backgroundColor: colors.bgElevated,
        },
        typeBadgeText: {
          fontSize: 11,
          fontFamily: FontFamily.mono,
          fontWeight: "400",
          color: colors.textMuted,
          letterSpacing: 0.2,
        },
        dayChipRow: { flexDirection: "row", gap: 6 },
        dayChip: {
          width: 20,
          height: 20,
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
        activationDateText: {
          fontSize: 13,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.textPrimary,
        },
        activationContractText: {
          fontSize: 12,
          fontFamily: FontFamily.mono,
          fontWeight: "400",
          color: colors.textSecondary,
        },
        addActivationRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        addActivationBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: 10,
          paddingVertical: 7,
          borderRadius: Radius.full,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.accent,
        },
        addActivationBtnDisabled: { borderColor: colors.border },
        addActivationBtnText: {
          fontSize: 12,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.accent,
        },
        addActivationBtnTextDisabled: { color: colors.textMuted },
        addActivationMenu: {
          borderRadius: Radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor: colors.bgCard,
          overflow: "hidden",
        },
        addActivationMenuItem: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        addActivationMenuItemDisabled: { opacity: 0.5 },
        addActivationMenuItemLast: { borderBottomWidth: 0 },
        addActivationMenuItemLabel: {
          fontSize: 13,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.textPrimary,
        },
        addActivationMenuItemLabelDisabled: { color: colors.textMuted },
        addActivationMenuItemSub: {
          fontSize: 11,
          fontFamily: FontFamily.body,
          fontWeight: "400",
          color: colors.textMuted,
          marginTop: 2,
        },

        // --- manage row (delete) ---
        manageRow: {
          flexDirection: "row",
          gap: 8,
          marginTop: 16,
          paddingTop: 14,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        manageBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          flex: 1,
          paddingVertical: 10,
          borderRadius: Radius.md,
          backgroundColor: colors.bgElevated,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        manageBtnText: {
          fontSize: 13,
          fontFamily: FontFamily.bodyMedium,
          fontWeight: "500",
          color: colors.textSecondary,
        },
        deleteBtn: {
          borderColor: colors.danger ?? "#E5484D",
        },
        deleteBtnFull: { flex: 1 },
        deleteBtnText: {
          color: colors.danger ?? "#E5484D",
        },

        actionRow: { flexDirection: "row", gap: 10, marginTop: 16 },
        actionBtn: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: ComponentSize.primaryBtnVerticalPadding,
          borderRadius: Radius.md,
        },
        actionBtnSecondary: { flex: 0.8 },
        saveBtn: { backgroundColor: colors.accent },
        saveBtnText: {
          fontSize: 14,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
          color: colors.white,
        },
        activateBtn: { backgroundColor: colors.accent },
        activateBtnText: {
          fontSize: 14,
          fontFamily: FontFamily.bodySemiBold,
          fontWeight: "600",
          color: colors.white,
        },
        activateBtnTextSecondary: { color: colors.accent },
      }),
    [colors],
  );
}
