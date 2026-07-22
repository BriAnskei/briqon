import { useMemo, useState } from "react";
import Toast from "react-native-toast-message";
import useModal from "@/hooks/useModal";
import type { Schedule } from "@/src/models/schedule.model";
import type { SubSummary } from "@/src/models/sub_summaries.model";
import type { ScheduleSummary } from "@/src/models/summaries.model";
import { ScheduleService } from "@/src/service/schedule.service";
import type { ScheduleItem } from "../../components/GenerateScheduleScreen/types";

const useSaveScheduleModal = (payload: {
	summaries: ScheduleSummary[];
	subSummaries: SubSummary[];
	scheduleItem: ScheduleItem[];
}) => {
	const { summaries, subSummaries, scheduleItem } = payload;

	const { isOpen, open, close } = useModal();
	const service = useMemo(() => new ScheduleService(), []);

	const [name, setName] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const handleSaveSchedule = async () => {
		if (isSaving || name.length === 0) return;
		setIsSaving(true);

		try {
			const schedule = buildSchedule();

			await service.createSchedule({
				summaries,
				subSummaries,
				schedule,
			});

			Toast.show({
				type: "success",
				text1: "Success",
				text2: "Schedule saved successfully",
				position: "top",
			});
			closeSaveSchedModal();
		} catch (err) {
			console.error(err);
			Toast.show({
				type: "error",
				text1: "Failed to save",
				text2: "Failed to save schedule",
				position: "top",
			});
		} finally {
			setIsSaving(false);
		}
	};

	const buildSchedule = (): Schedule => {
		return {
			id: "",
			schedule_list: scheduleItem,
			name,
			temporary: false,
		};
	};
	const closeSaveSchedModal = () => {
		setName("");
		close();
	};
	return {
		isSaveModalOpen: isOpen,
		openSaveSchedModal: open,
		closeSaveSchedModal,
		handleSaveSchedule,
		setName,
		name,
		isSaving,
	};
};

export default useSaveScheduleModal;
