/* eslint-disable react-hooks/exhaustive-deps */
import {
  MealPlacement,
  Meals,
  MealType,
  NewScheduleFormState,
} from "@/type/NewScheduleTypes";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export type UseMealsStateType = {
  toggleIncludeMeals: () => void;
  handlePlacement: (id: string, placement: MealPlacement) => void;
  toggleMealType: (type: MealType, duration: number) => void;
  toggleTimePicker: (id: string) => void;
  showTimepickerFor: string | undefined;
  reduceDuration: (id: string) => void;
  increaseDuration: (id: string) => void;
  patchMeal: (id: string, p: Partial<Meals>) => void;
  includeMeal: boolean;
  meals: Meals[] | undefined;
};

type Payload = {
  form: NewScheduleFormState;
  setForm: React.Dispatch<React.SetStateAction<NewScheduleFormState>>;
  step: number;
};

const useMeals = ({ form, setForm, step }: Payload): UseMealsStateType => {
  const meals: Meals[] = form?.meals ?? [];

  const [includeMeal, setIncludeMeals] = useState(false);
  const [showTimepickerFor, setShowTimepickerFor] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    if (step > 3 && meals.length === 0) {
      setIncludeMeals(false);
    }
  }, [step, meals]);

  const toggleMealType = (type: MealType, duration: number) => {
    const existing = meals.find((m) => m.type === type);

    if (existing) {
      setForm((prev) => ({
        ...prev,
        meals: prev.meals.filter((m) => m.type !== type),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        meals: [...(prev.meals ?? []), initializeMealObject(type, duration)],
      }));
    }
  };

  const patchMeal = (id: string, p: Partial<Meals>) => {
    setForm((prev) => ({
      ...prev,
      meals: prev.meals.map((m) => (m.id === id ? { ...m, ...p } : m)),
    }));
  };

  const anchoredFirstId = meals.find((m) => m.placement === "anchor_first")?.id;
  const anchoredLastId = meals.find((m) => m.placement === "anchor_last")?.id;

  const handlePlacement = (id: string, placement: MealPlacement) => {
    // Enforce only one anchor first and last
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

    const fixedTime = new Date();
    fixedTime.setHours(0, 0, 0, 0);
    patchMeal(id, {
      placement,
      fixedTime: placement === "fixed_time" ? fixedTime : undefined,
    });
  };

  return {
    toggleIncludeMeals: () =>
      setIncludeMeals((prev) => {
        setForm((prev) => ({ ...prev, meals: [] }));

        return !prev;
      }),
    handlePlacement,
    toggleMealType,

    toggleTimePicker: (id: string) =>
      setShowTimepickerFor((p) => (p === id ? undefined : id)),
    showTimepickerFor,

    reduceDuration: (id: string) => {
      const prevDuration = meals.find((m) => m.id == id)?.durationMinutes ?? 0;

      patchMeal(id, {
        durationMinutes: prevDuration <= 5 ? prevDuration : prevDuration - 5,
      });
    },
    increaseDuration: (id: string) => {
      const prevDuration = meals.find((m) => m.id == id)?.durationMinutes ?? 0;

      patchMeal(id, {
        durationMinutes: prevDuration + 5,
      });
    },

    patchMeal,

    includeMeal,
    meals,
  };
};

export default useMeals;

// Helper functions
function initializeMealObject(type: MealType, duration: number): Meals {
  return {
    id: uuidv4(),
    type,
    durationMinutes: duration,
    placement: "flexible",
  };
}
