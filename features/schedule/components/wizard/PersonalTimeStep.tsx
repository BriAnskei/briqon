import { View } from "react-native";
import { NewScheduleFormState } from "@/type/NewScheduleTypes";
import { TimeWindowSettings } from "./TimeWindowSettings";
import { AppointmentsSection } from "./AppointmentsSection";
import { MealsSection } from "./MealsSection";
import { UseMealsStateType } from "../../hooks/useMeals";
import { UseAppointmentsStateType } from "../../hooks/useAppointments";

type Props = {
  form: NewScheduleFormState;
  patch: (p: Partial<NewScheduleFormState>) => void;
  apptState: UseAppointmentsStateType;
  mealsState: UseMealsStateType;
};

export function PersonalTimeStep({
  form,
  patch,
  apptState,
  mealsState,
}: Props) {
  return (
    <View style={s.body}>
      <TimeWindowSettings form={form} patch={patch} />
      <AppointmentsSection {...apptState} />
      <MealsSection {...mealsState} />
    </View>
  );
}

const s = {
  body: { paddingTop: 8 },
};
