import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Shadow } from "@/type/theme";
import { NewScheduleFormState } from "@/type/NewScheduleTypes";
import { formatMinutes } from "../../utils/wizardHelpers";
import { TimeWindowSettings } from "./TimeWindowSettings";
import { AppointmentsSection } from "./AppointmentsSection";
import { MealsSection } from "./MealsSection";
import { UseMealsStateType } from "../../hooks/useMeals";
import { UseAppointmentsStateType } from "../../hooks/useAppointments";
import { FixedScheduleDuration } from "../../hooks/useWizardForm";

type Props = {
  form: NewScheduleFormState;
  patch: (p: Partial<NewScheduleFormState>) => void;
  apptState: UseAppointmentsStateType;
  mealsState: UseMealsStateType;
  fixedScheduleDuration: FixedScheduleDuration;
};

export function PersonalTimeStep({
  form,
  patch,
  apptState,
  mealsState,
  fixedScheduleDuration,
}: Props) {
  const { appMinutes, mealMinutes, overAllMinutes } = fixedScheduleDuration;

  return (
    <View style={s.body}>
      <View style={s.sectionCard}>
        <TimeWindowSettings form={form} patch={patch} />
      </View>

      {/* ── Overall summary — visually distinct from per-section totals ── */}
      <View style={s.overallBanner}>
        <View style={s.overallIcon}>
          <Ionicons name="layers-outline" size={16} color={Colors.bg} />
        </View>
        <View style={s.overallTextWrap}>
          <Text style={s.overallLabel}>Total scheduled time</Text>
          <Text style={s.overallValue}>{formatMinutes(overAllMinutes)}</Text>
        </View>
      </View>

      <View style={s.sectionCard}>
        <AppointmentsSection {...apptState} totalMinutes={appMinutes} />
      </View>
      <View style={s.sectionCard}>
        <MealsSection {...mealsState} totalMinutes={mealMinutes} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  body: { paddingTop: 8 },
  sectionCard: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 16,
    backgroundColor: "transparent",
  },
  overallBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  overallIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  overallTextWrap: { flex: 1 },
  overallLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  overallValue: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
});
