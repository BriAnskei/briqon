import {
	EventItemDraft,
	EventScheduleItem,
	NewScheduleFormState,
} from "@/type/NewScheduleTypes";
import { useState } from "react";
import { defaultEventItemDraft } from "../../utils/wizardHelpers";
import { v4 as uuidv4 } from "uuid";

export type UseEventItemsStateType = {
	eventItemDraft: EventItemDraft;
	patchEventItem: (p: Partial<EventItemDraft>) => void;
	showDraft: () => void;
	hideDraft: () => void;
	commitEventItem: () => void;
	removeEventItem: (id: string) => void;
	toggleFixedTime: () => void;
	toggleFixedTimePicker: () => void;
	eventScheduleItems: EventScheduleItem[];
};

type Payload = {
	form: NewScheduleFormState;
	setForm: React.Dispatch<React.SetStateAction<NewScheduleFormState>>;
};

const useEventItems = ({ form, setForm }: Payload): UseEventItemsStateType => {
	const eventScheduleItems: EventScheduleItem[] =
		form?.eventScheduleItems ?? [];

	const [eventItemDraft, setEventItemDraft] = useState<EventItemDraft>(
		defaultEventItemDraft(),
	);

	const patchEventItem = (p: Partial<EventItemDraft>) =>
		setEventItemDraft((prev) => ({ ...prev, ...p }));

	const commitEventItem = () => {
		if (
			!eventItemDraft.visible ||
			!eventItemDraft.name.trim() ||
			(!eventItemDraft.durationHours.trim() &&
				!eventItemDraft.durationMinutes.trim())
		)
			return;

		const item: EventScheduleItem = {
			id: uuidv4(),
			name: eventItemDraft.name.trim(),
			durationMinutes: parseDurationInput(
				eventItemDraft.durationHours,
				eventItemDraft.durationMinutes,
			),
			isFixedTime: eventItemDraft.isFixedTime,
			fixedTime: eventItemDraft.isFixedTime
				? eventItemDraft.fixedTime
				: undefined,
		};

		setForm((prev) => ({
			...prev,
			eventScheduleItems: [...prev.eventScheduleItems, item],
		}));
		setEventItemDraft(defaultEventItemDraft());
	};

	const removeEventItem = (id: string) =>
		setForm((prev) => ({
			...prev,
			eventScheduleItems: prev.eventScheduleItems.filter((i) => i.id !== id),
		}));

	const toggleFixedTime = () => {
		const next = !eventItemDraft.isFixedTime;
		patchEventItem({
			isFixedTime: next,
			fixedTime: next
				? (eventItemDraft.fixedTime ?? defaultFixedTime())
				: undefined,
			showFixedTimePicker: false,
		});
	};

	const toggleFixedTimePicker = () =>
		patchEventItem({
			showFixedTimePicker: !eventItemDraft.showFixedTimePicker,
		});

	return {
		eventItemDraft,
		patchEventItem,
		showDraft: () =>
			setEventItemDraft({ ...defaultEventItemDraft(), visible: true }),
		hideDraft: () => patchEventItem({ visible: false }),
		commitEventItem,
		removeEventItem,
		toggleFixedTime,
		toggleFixedTimePicker,
		eventScheduleItems,
	};
};

export default useEventItems;

// ── Helpers ──────────────────────────────────────────────────────────────
function parseDurationInput(hrs: string, mins: string): number | null {
	const h = parseFloat(hrs);
	const m = parseFloat(mins);
	const validH = !isNaN(h) && h > 0 ? h : 0;
	const validM = !isNaN(m) && m > 0 ? m : 0;

	if (validH === 0 && validM === 0) return null;

	return Math.round(validH * 60 + validM);
}

function defaultFixedTime(): Date {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
}
