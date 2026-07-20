import {
	AppointmentDraft,
	EventItemDraft,
	NewScheduleFormState,
	Appointment,
} from "@/type/NewScheduleTypes";
import { APPOINTMENT_TYPES } from "../contants/wizardOptions";

export function defaultAppointmentDraft(): AppointmentDraft {
	const s = new Date();
	s.setHours(9, 0, 0, 0);
	const e = new Date();
	e.setHours(10, 0, 0, 0);
	return {
		visible: false,
		type: "work",
		customLabel: "",
		startTime: s,
		endTime: e,
		showStartPicker: false,
		showEndPicker: false,
	};
}

export function defaultEventItemDraft(): EventItemDraft {
	return {
		visible: false,
		name: "",
		durationHours: "",
		durationMinutes: "45", // ← default 45 min
		isFixedTime: false,
		fixedTime: undefined,
		showFixedTimePicker: false,
	};
}

export function defaultForm(): NewScheduleFormState {
	const start = new Date();
	start.setHours(0, 0, 0, 0);
	const end = new Date();
	end.setHours(0, 0, 0, 0);
	return {
		scheduleType: null,
		startTime: start,
		endTime: end,
		showStartPicker: false,
		showEndPicker: false,
		appointments: [],
		breakFrequency: null,
		priorityDurationMinutes: 0,
		priorityFocusText: "",
		meals: [],
		eventType: null,
		eventOtherLabel: "",
		eventScheduleItems: [],
	};
}

export function appointmentLabel(appt: Appointment): string {
	if (appt.type === "custom" && appt.customLabel.trim())
		return appt.customLabel.trim();
	return APPOINTMENT_TYPES.find((t) => t.key === appt.type)?.label ?? appt.type;
}
