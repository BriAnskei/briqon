/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { NewScheduleFormState } from "@/type/NewScheduleTypes";
import { defaultForm } from "../../utils/wizardHelpers";
import {
	EVENT_TOTAL_STEPS,
	PERSONAL_TOTAL_STEPS,
} from "../../contants/wizardOptions";
import { useAI } from "@/context/AIContext";
import useMeals from "./useMeal";
import useAppointments from "./useAppointments";

import { useWizardValidation } from "./useScheduleFormValidator";
import useEventItems from "./useEventItems";

export type FixedScheduleDuration = {
	appMinutes: number;
	mealMinutes: number;
	overAllMinutes: number;
};

export type PersonalSummary = {
	windowMinutes: number;
	appointmentMinutes: number;
	mealMinutes: number;
	remainingMinutes: number;
};

export type EventSummary = {
	windowMinutes: number;
	totalItemMinutes: number;
	totalItems: number;
	remainingMinutes: number;
};

export function useWizardForm() {
	const router = useRouter();
	const { setInputForm } = useAI();

	const [step, setStep] = useState(0);
	const [form, setForm] = useState<NewScheduleFormState>(defaultForm());

	// moved above validation/stepError — was previously declared after
	// stepError's useMemo, which referenced it before initialization (TDZ bug)
	const isEvent = form.scheduleType === "event";
	const totalSteps = isEvent ? EVENT_TOTAL_STEPS : PERSONAL_TOTAL_STEPS;

	const { validator, fixedScheduleDuration, validation, stepError } =
		useWizardValidation({
			form,
			step,
			isEvent,
		});

	const patch = (p: Partial<NewScheduleFormState>) =>
		setForm((prev) => ({ ...prev, ...p }));

	const mealsState = useMeals({ form, setForm, step });
	const apptState = useAppointments({ form, setForm });
	const eventItemsState = useEventItems({ form, setForm });

	// ── Per-step summary (window / meals / appointments / remaining, etc.) ──
	const personalSummary = useMemo<PersonalSummary | null>(() => {
		if (isEvent) return null;
		const windowMinutes = validator.getWindowMinutes();
		const breakMinutes = form.breakFrequency
			? validator.getBreakWindowMin()
			: 0;

		const remainingMinutes = Math.max(
			0,
			windowMinutes -
				fixedScheduleDuration.appMinutes -
				fixedScheduleDuration.mealMinutes -
				breakMinutes,
		);
		return {
			windowMinutes,
			appointmentMinutes: fixedScheduleDuration.appMinutes,
			mealMinutes: fixedScheduleDuration.mealMinutes,
			remainingMinutes,
		};
	}, [validator, form, fixedScheduleDuration, isEvent]);

	const eventSummary = useMemo<EventSummary | null>(() => {
		if (!isEvent) return null;
		const windowMinutes = validator.getWindowMinutes();
		const totalItemMinutes = form.eventScheduleItems.reduce(
			(acc, item) => acc + (item.durationMinutes ?? 0),
			0,
		);
		const remainingMinutes = Math.max(0, windowMinutes - totalItemMinutes);
		return {
			windowMinutes,
			totalItemMinutes,
			totalItems: form.eventScheduleItems.length,
			remainingMinutes,
		};
	}, [validator, form, isEvent]);

	const showStepErrorToast = (message: string) => {
		Toast.show({
			type: "error",
			text1: "Invalid Input",
			text2: message,
			position: "top",
		});
	};

	useEffect(() => {
		if (form.scheduleType === null || step === 0) return;

		if (stepError) {
			showStepErrorToast(stepError);
		} else {
			Toast.hide();
		}
	}, [validation, step]);

	// ── Navigation ──────────────────────────────────────────────────────────────
	const isLastStep = () => step === totalSteps - 1;

	const canProceed = (): boolean => {
		if (step === 0) return form.scheduleType !== null;
		if (isEvent) {
			if (step === 1)
				return (
					form.eventType !== null &&
					(form.eventType !== "other" || !!form.eventOtherLabel.trim())
				);
			if (step === 2) return true; // Time window
			if (step === 3) return true; // Event items (optional)
		} else {
			if (step === 1) {
				return true; // Time window
			}
			if (step === 2) {
				return true; // Appointments (optional)
			}
			if (step === 3) {
				return true; // Meals (optional)
			}
			if (step === 4) return form.breakFrequency !== null;
			if (step === 5) return !!form.priorityFocusText?.trim().length;
		}
		return false;
	};

	const handleNext = async () => {
		if (!canProceed()) return;

		if (stepError) {
			showStepErrorToast(stepError);
			return;
		}

		if (apptState.apptDraft.visible) apptState.hideDraft();
		if (eventItemsState.eventItemDraft.visible) eventItemsState.hideDraft();
		if (isLastStep()) {
			setInputForm(form);
			router.push("/schedule/generation");

			// await AIService?.generateSchedule(prompt, systemInstruction);
		} else setStep((s) => s + 1);
	};

	const handleBack = () => {
		if (step > 0) setStep((s) => s - 1);
		else router.back();
	};

	return {
		validation,
		step,
		form,
		isEvent,
		totalSteps,
		patch,
		isLastStep,
		canProceed,
		handleNext,
		handleBack,
		mealsState,
		apptState,
		eventItemsState,
		validator,
		stepError,
		fixedScheduleDuration,
		personalSummary,
		eventSummary,
	};
}
