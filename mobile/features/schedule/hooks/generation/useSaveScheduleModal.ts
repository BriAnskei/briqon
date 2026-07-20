import useModal from "@/hooks/useModal";
import { Schedule } from "@/src/models/schedule.model";
import { SubSummary } from "@/src/models/sub_summaries.model";
import { ScheduleSummary } from "@/src/models/summaries.model";
import { ScheduleService } from "@/src/service/schedule.service";
import { useMemo, useState } from "react";
import { ScheduleItem } from "../../components/GenerateScheduleScreen/types";

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
      const schedule: Schedule = {
        id: "",
        schedule_list: scheduleItem,
        name,
        temporary: false,
      };

      await service.createSchedule({
        summaries,
        subSummaries,
        schedule,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaveModalOpen: isOpen,
    openSaveSchedModal: open,
    closeSaveSchedModal: () => {
      setName("");
      close();
    },
    handleSaveSchedule,
    setName,
    name,
    isSaving,
  };
};

export default useSaveScheduleModal;
