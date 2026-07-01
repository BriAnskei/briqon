import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors, Radius, Shadow } from "@/type/theme";

import {
  durationText,
  formatTime,
  appointmentLabel,
} from "../../utils/wizardHelpers";
import { TimeRow } from "@/components/TimeRow";
import {
  NewScheduleFormState,
  AppointmentDraft,
} from "@/type/NewScheduleTypes";
import { APPOINTMENT_TYPES } from "../../contants/wizardOptions";

// ─── Meal config (TEMP local types — move into NewScheduleTypes.ts when wiring useWizardForm) ───
type MealType = "breakfast" | "lunch" | "dinner" | "snack";
type MealPlacement = "flexible" | "anchor_first" | "anchor_last" | "fixed_time";

type MealConfig = {
  id: string;
  type: MealType;
  enabled: boolean;
  durationMinutes: number;
  placement: MealPlacement;
  fixedTime?: Date;
};

type MealSettings = {
  includeMeals: boolean;
  meals: MealConfig[];
};

const MEAL_TYPES: {
  key: MealType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  defaultMins: number;
}[] = [
  {
    key: "breakfast",
    label: "Breakfast",
    icon: "sunny-outline",
    defaultMins: 30,
  },
  { key: "lunch", label: "Lunch", icon: "restaurant-outline", defaultMins: 45 },
  { key: "dinner", label: "Dinner", icon: "moon-outline", defaultMins: 45 },
  { key: "snack", label: "Snack", icon: "cafe-outline", defaultMins: 15 },
];

const PLACEMENT_OPTIONS: { key: MealPlacement; label: string }[] = [
  { key: "flexible", label: "Flexible" },
  { key: "anchor_first", label: "First item" },
  { key: "anchor_last", label: "Last item" },
  { key: "fixed_time", label: "Fixed time" },
];

function makeDefaultMeal(type: MealType): MealConfig {
  const meta = MEAL_TYPES.find((m) => m.key === type)!;
  return {
    id: `${type}-${Date.now()}`,
    type,
    enabled: true,
    durationMinutes: meta.defaultMins,
    placement: "flexible",
  };
}

const DEFAULT_MEAL_SETTINGS: MealSettings = {
  includeMeals: false,
  meals: [],
};

type Props = {
  form: NewScheduleFormState;
  patch: (p: Partial<NewScheduleFormState>) => void;
  apptDraft: AppointmentDraft;
  patchAppt: (p: Partial<AppointmentDraft>) => void;
  commitAppointment: () => void;
  removeAppointment: (id: string) => void;
};

export function PersonalTimeStep({
  form,
  patch,
  apptDraft,
  patchAppt,
  commitAppointment,
  removeAppointment,
}: Props) {
  // ── TEMP local meal state — replace with form.mealSettings once added to useWizardForm ──
  const [mealSettings, setMealSettings] = useState<MealSettings>(
    DEFAULT_MEAL_SETTINGS,
  );
  const [showTimePickerFor, setShowTimePickerFor] = useState<string | null>(
    null,
  );

  const patchMealSettings = (p: Partial<MealSettings>) => {
    setMealSettings((prev) => ({ ...prev, ...p }));
  };

  const toggleMealType = (type: MealType) => {
    const existing = mealSettings.meals.find((m) => m.type === type);
    if (existing) {
      patchMealSettings({
        meals: mealSettings.meals.filter((m) => m.type !== type),
      });
    } else {
      patchMealSettings({
        meals: [...mealSettings.meals, makeDefaultMeal(type)],
      });
    }
  };

  const patchMeal = (id: string, p: Partial<MealConfig>) => {
    patchMealSettings({
      meals: mealSettings.meals.map((m) => (m.id === id ? { ...m, ...p } : m)),
    });
  };

  const anchoredFirstId = mealSettings.meals.find(
    (m) => m.placement === "anchor_first",
  )?.id;
  const anchoredLastId = mealSettings.meals.find(
    (m) => m.placement === "anchor_last",
  )?.id;

  const setPlacement = (id: string, placement: MealPlacement) => {
    // Enforce only one anchor_first and one anchor_last across all meals
    if (
      placement === "anchor_first" &&
      anchoredFirstId &&
      anchoredFirstId !== id
    ) {
      patchMeal(anchoredFirstId, { placement: "flexible" });
    }
    if (
      placement === "anchor_last" &&
      anchoredLastId &&
      anchoredLastId !== id
    ) {
      patchMeal(anchoredLastId, { placement: "flexible" });
    }
    patchMeal(id, {
      placement,
      fixedTime: placement === "fixed_time" ? new Date() : undefined,
    });
  };

  return (
    <View style={s.body}>
      <Text style={s.title}>Set your time window</Text>
      <Text style={s.sub}>When does your schedule start and end?</Text>

      {/* ── Main time pickers ─────────────────────────────────────────── */}
      <View style={s.gap16}>
        <TimeRow
          label="Start Time"
          icon="play-circle-outline"
          time={form.startTime}
          onPress={() => patch({ showStartPicker: true })}
        />
        <TimeRow
          label="End Time"
          icon="stop-circle-outline"
          time={form.endTime}
          onPress={() => patch({ showEndPicker: true })}
        />
      </View>

      {form.showStartPicker && (
        <DateTimePicker
          value={form.startTime}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, d) => {
            patch({ showStartPicker: false });
            if (d) patch({ startTime: d });
          }}
        />
      )}
      {form.showEndPicker && (
        <DateTimePicker
          value={form.endTime}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, d) => {
            patch({ showEndPicker: false });
            if (d) patch({ endTime: d });
          }}
        />
      )}

      <View style={s.durationHint}>
        <Ionicons name="hourglass-outline" size={14} color={Colors.textMuted} />
        <Text style={s.durationText}>
          {durationText(form.startTime, form.endTime)}
        </Text>
      </View>

      {/* ── Appointments ─────────────────────────────────────────────── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionLabel}>
            Appointments <Text style={s.optional}>(optional)</Text>
          </Text>
          {!apptDraft.visible && (
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => patchAppt({ visible: true })}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={14} color={Colors.accent} />
              <Text style={s.addBtnText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Committed appointments */}
        {form.appointments.map((appt) => {
          const meta = APPOINTMENT_TYPES.find((t) => t.key === appt.type)!;
          return (
            <View key={appt.id} style={s.apptCard}>
              <View style={s.apptIcon}>
                <Ionicons name={meta.icon} size={16} color={Colors.accent} />
              </View>
              <View style={s.apptBody}>
                <Text style={s.apptTitle}>{appointmentLabel(appt)}</Text>
                <Text style={s.apptTime}>
                  {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => removeAppointment(appt.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={20}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Draft form */}
        {apptDraft.visible && (
          <View style={s.draftCard}>
            {/* Type chips */}
            <Text style={s.draftFieldLabel}>Type</Text>
            <View style={s.chipRow}>
              {APPOINTMENT_TYPES.map((t) => {
                const active = apptDraft.type === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => patchAppt({ type: t.key })}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={t.icon}
                      size={13}
                      color={active ? Colors.accent : Colors.textMuted}
                    />
                    <Text style={[s.chipText, active && s.chipTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom label */}
            {apptDraft.type === "custom" && (
              <>
                <Text style={[s.draftFieldLabel, { marginTop: 12 }]}>
                  Label
                </Text>
                <View style={s.inputRow}>
                  <Ionicons
                    name="create-outline"
                    size={15}
                    color={Colors.textMuted}
                  />
                  <TextInput
                    style={s.inputField}
                    value={apptDraft.customLabel}
                    onChangeText={(t) => patchAppt({ customLabel: t })}
                    placeholder="e.g. Gym, Therapy, Errand..."
                    placeholderTextColor={Colors.textMuted}
                    returnKeyType="done"
                  />
                </View>
              </>
            )}

            {/* Time block */}
            <Text style={[s.draftFieldLabel, { marginTop: 12 }]}>
              Time Block
            </Text>
            <View style={s.gap16}>
              <TimeRow
                label="Start"
                icon="play-circle-outline"
                time={apptDraft.startTime}
                onPress={() => patchAppt({ showStartPicker: true })}
              />
              <TimeRow
                label="End"
                icon="stop-circle-outline"
                time={apptDraft.endTime}
                onPress={() => patchAppt({ showEndPicker: true })}
              />
            </View>
            {apptDraft.showStartPicker && (
              <DateTimePicker
                value={apptDraft.startTime}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, d) => {
                  patchAppt({ showStartPicker: false });
                  if (d) patchAppt({ startTime: d });
                }}
              />
            )}
            {apptDraft.showEndPicker && (
              <DateTimePicker
                value={apptDraft.endTime}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, d) => {
                  patchAppt({ showEndPicker: false });
                  if (d) patchAppt({ endTime: d });
                }}
              />
            )}

            {/* Actions */}
            <View style={s.draftActions}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => patchAppt({ visible: false })}
                activeOpacity={0.8}
              >
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.confirmBtn}
                onPress={commitAppointment}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark" size={15} color={Colors.white} />
                <Text style={s.confirmText}>Add Appointment</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {form.appointments.length === 0 && !apptDraft.visible && (
          <Text style={s.empty}>No appointments added yet.</Text>
        )}
      </View>

      {/* ── Meals ─────────────────────────────────────────────────────── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionLabel}>
            Meals <Text style={s.optional}>(optional)</Text>
          </Text>
          <TouchableOpacity
            style={[s.toggle, mealSettings.includeMeals && s.toggleActive]}
            onPress={() =>
              patchMealSettings({ includeMeals: !mealSettings.includeMeals })
            }
            activeOpacity={0.8}
          >
            <View
              style={[
                s.toggleKnob,
                mealSettings.includeMeals && s.toggleKnobActive,
              ]}
            />
          </TouchableOpacity>
        </View>

        {!mealSettings.includeMeals && (
          <Text style={s.empty}>Meals won't be included in this schedule.</Text>
        )}

        {mealSettings.includeMeals && (
          <>
            {/* Meal type chips */}
            <View style={s.chipRow}>
              {MEAL_TYPES.map((t) => {
                const active = mealSettings.meals.some((m) => m.type === t.key);
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => toggleMealType(t.key)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={t.icon}
                      size={13}
                      color={active ? Colors.accent : Colors.textMuted}
                    />
                    <Text style={[s.chipText, active && s.chipTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* Per-meal config cards */}
            {mealSettings.meals.map((meal) => {
              const meta = MEAL_TYPES.find((t) => t.key === meal.type)!;
              return (
                <View key={meal.id} style={s.mealCard}>
                  <View style={s.mealCardHeader}>
                    <View style={s.mealIcon}>
                      <Ionicons
                        name={meta.icon}
                        size={16}
                        color={Colors.accent}
                      />
                    </View>
                    <Text style={s.mealTitle}>{meta.label}</Text>
                    <Text style={s.mealDurationText}>
                      {meal.durationMinutes} min
                    </Text>
                  </View>

                  {/* Duration stepper */}
                  <View style={s.durationRow}>
                    <Text style={s.draftFieldLabel}>Duration</Text>
                    <View style={s.stepper}>
                      <TouchableOpacity
                        style={s.stepperBtn}
                        onPress={() =>
                          patchMeal(meal.id, {
                            durationMinutes: Math.max(
                              5,
                              meal.durationMinutes - 5,
                            ),
                          })
                        }
                      >
                        <Ionicons
                          name="remove"
                          size={14}
                          color={Colors.textMuted}
                        />
                      </TouchableOpacity>
                      <Text style={s.stepperValue}>
                        {meal.durationMinutes}m
                      </Text>
                      <TouchableOpacity
                        style={s.stepperBtn}
                        onPress={() =>
                          patchMeal(meal.id, {
                            durationMinutes: Math.min(
                              120,
                              meal.durationMinutes + 5,
                            ),
                          })
                        }
                      >
                        <Ionicons
                          name="add"
                          size={14}
                          color={Colors.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Placement segmented control */}
                  <Text style={[s.draftFieldLabel, { marginTop: 10 }]}>
                    Placement
                  </Text>
                  <View style={s.segmentRow}>
                    {PLACEMENT_OPTIONS.map((opt) => {
                      const active = meal.placement === opt.key;
                      return (
                        <TouchableOpacity
                          key={opt.key}
                          style={[s.segment, active && s.segmentActive]}
                          onPress={() => setPlacement(meal.id, opt.key)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              s.segmentText,
                              active && s.segmentTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Fixed time picker */}
                  {meal.placement === "fixed_time" && (
                    <View style={{ marginTop: 10 }}>
                      <TouchableOpacity
                        style={s.inputRow}
                        onPress={() => setShowTimePickerFor(meal.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="time-outline"
                          size={15}
                          color={Colors.textMuted}
                        />
                        <Text style={s.inputField}>
                          {meal.fixedTime
                            ? formatTime(meal.fixedTime)
                            : "Set time"}
                        </Text>
                      </TouchableOpacity>
                      {showTimePickerFor === meal.id && (
                        <DateTimePicker
                          value={meal.fixedTime ?? new Date()}
                          mode="time"
                          display={
                            Platform.OS === "ios" ? "spinner" : "default"
                          }
                          onChange={(_, d) => {
                            setShowTimePickerFor(null);
                            if (d) patchMeal(meal.id, { fixedTime: d });
                          }}
                        />
                      )}
                    </View>
                  )}
                </View>
              );
            })}
            {mealSettings.meals.length === 0 && (
              <Text style={s.empty}>Select which meals to include above.</Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  body: { paddingTop: 8 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 24,
  },
  gap16: { gap: 16 },
  durationHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  durationText: { fontSize: 12, color: Colors.textMuted },

  section: { marginTop: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  optional: { fontWeight: "400", color: Colors.textMuted },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accentSoft,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
  },
  addBtnText: { fontSize: 12, fontWeight: "700", color: Colors.accent },

  apptCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 12,
    marginBottom: 8,
    ...Shadow.card,
  },
  apptIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  apptBody: { flex: 1 },
  apptTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  apptTime: { fontSize: 12, color: Colors.textMuted },
  apptNote: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
    fontStyle: "italic",
  },

  draftCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.accent + "40",
    padding: 16,
    gap: 4,
    marginBottom: 8,
    ...Shadow.card,
  },
  draftFieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
    marginBottom: 6,
  },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
  },
  chipText: { fontSize: 12, fontWeight: "600", color: Colors.textMuted },
  chipTextActive: { color: Colors.accent },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  inputField: { flex: 1, fontSize: 14, color: Colors.textPrimary, padding: 0 },

  draftActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cancelText: { fontSize: 13, fontWeight: "600", color: Colors.textMuted },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    ...Shadow.accent,
  },
  confirmText: { fontSize: 13, fontWeight: "700", color: Colors.white },
  empty: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: 16,
  },

  // ── Meals ─────────────────────────────────────────────────────────────
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 999,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: Colors.textMuted,
  },
  toggleKnobActive: {
    backgroundColor: Colors.accent,
    transform: [{ translateX: 18 }],
  },

  mealCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
    ...Shadow.card,
  },
  mealCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  mealIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  mealTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  mealDurationText: { fontSize: 12, color: Colors.textMuted },

  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    minWidth: 32,
    textAlign: "center",
  },

  segmentRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  segment: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentActive: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
  },
  segmentText: { fontSize: 11, fontWeight: "600", color: Colors.textMuted },
  segmentTextActive: { color: Colors.accent },
});
