import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Shadow } from "@/type/theme";

import { TimeFormatter } from "@/utils/TimeFormatter";
import DateTimePicker from "@react-native-community/datetimepicker";

import { MealPlacement, MealType } from "@/type/NewScheduleTypes";

import { UseMealsStateType } from "../../hooks/useMeals";

const MEAL_TYPES = [
  {
    key: "breakfast / morning outine" as MealType,
    label: "Breakfast / Morning Routine",
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

type Props = UseMealsStateType;

export function MealsSection({
  includeMeal,
  toggleIncludeMeals,
  handlePlacement,
  toggleMealType,
  reduceDuration,
  increaseDuration,
  patchMeal,
  showTimepickerFor,
  toggleTimePicker,
  meals,
}: Props) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionLabel}>
          Meals <Text style={s.optional}>(optional)</Text>
        </Text>
        <TouchableOpacity
          style={[s.toggle, includeMeal && s.toggleActive]}
          onPress={toggleIncludeMeals}
          activeOpacity={0.8}
        >
          <View style={[s.toggleKnob, includeMeal && s.toggleKnobActive]} />
        </TouchableOpacity>
      </View>

      {!includeMeal && (
        <Text style={s.empty}>Meals won't be included in this schedule.</Text>
      )}

      {includeMeal && (
        <>
          <View style={s.chipRow}>
            {MEAL_TYPES.map((t) => {
              const active = (meals ?? []).some((m) => m.type === t.key);
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() =>
                    toggleMealType(t.key as MealType, t.defaultMins)
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={t.icon as any}
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

          {/* Per-meal config — cards */}
          {(meals ?? []).map((meal) => {
            const meta = MEAL_TYPES.find((t) => t.key === meal.type)!;
            return (
              <View key={meal.id} style={s.mealCard}>
                <View style={s.mealCardHeader}>
                  <View style={s.mealIcon}>
                    <Ionicons
                      name={meta.icon as any}
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
                      onPress={() => reduceDuration(meal.id)}
                    >
                      <Ionicons
                        name="remove"
                        size={14}
                        color={Colors.textMuted}
                      />
                    </TouchableOpacity>
                    <Text style={s.stepperValue}>{meal.durationMinutes}m</Text>
                    <TouchableOpacity
                      style={s.stepperBtn}
                      onPress={() => increaseDuration(meal.id)}
                    >
                      <Ionicons name="add" size={14} color={Colors.textMuted} />
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
                        onPress={() => handlePlacement(meal.id, opt.key)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[s.segmentText, active && s.segmentTextActive]}
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
                      onPress={() => toggleTimePicker(meal.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="time-outline"
                        size={15}
                        color={Colors.textMuted}
                      />
                      <Text style={s.inputField}>
                        {meal.fixedTime
                          ? TimeFormatter.formatTime(meal.fixedTime)
                          : "Set time"}
                      </Text>
                    </TouchableOpacity>
                    {showTimepickerFor === meal.id && (
                      <DateTimePicker
                        value={meal.fixedTime ?? new Date()}
                        mode="time"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={(_, d) => {
                          toggleTimePicker(meal.id);
                          if (d) patchMeal(meal.id, { fixedTime: d });
                        }}
                      />
                    )}
                  </View>
                )}
              </View>
            );
          })}
          {(meals ?? []).length === 0 && (
            <Text style={s.empty}>Select which meals to include above.</Text>
          )}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginTop: 0 },
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

  draftFieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
    marginBottom: 6,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 14,
  },
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

  empty: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: 16,
  },

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
