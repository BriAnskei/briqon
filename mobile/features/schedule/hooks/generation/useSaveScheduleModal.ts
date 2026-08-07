import { useCallback, useMemo, useState } from "react";
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
  generatedScheduleId?: string;
  isScheduleSavedDirectly: boolean;
  isScheduleSavedByActivation: boolean;
  setIsScheduleSavedDirectly: (b: boolean) => void;
}) => {
  const {
    summaries,
    subSummaries,
    scheduleItem,
    isScheduleSavedByActivation,
    isScheduleSavedDirectly,
    setIsScheduleSavedDirectly,
    generatedScheduleId,
  } = payload;

  const { isOpen, open, close } = useModal();
  const service = useMemo(() => new ScheduleService(), []);

  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const closeSaveSchedModal = () => {
    setName("");
    close();
  };

  const buildSchedule = useCallback((): Schedule => {
    if (!generatedScheduleId) throw new Error("No Schedule id");
    if (scheduleItem.length === 0) throw new Error("No scheduleItem to save`");

    return {
      id: generatedScheduleId,
      schedule_list: scheduleItem,
      name,
      temporary: false,
    };
  }, [generatedScheduleId, scheduleItem, name]);

  const handleSaveSchedule = useCallback(async () => {
    if (isSaving || name.length === 0) return;
    if (isScheduleSavedByActivation && isScheduleSavedDirectly) {
      Toast.show({
        type: "info",
        text1: "Already Saved",
        text2: "This schedule has already been saved.",
        position: "top",
      });
      return;
    }

    setIsSaving(true);

    try {
      const schedule = buildSchedule();

      if (!isScheduleSavedByActivation && !isScheduleSavedDirectly) {
        await service.createSchedule({
          summaries,
          subSummaries,
          schedule,
        });
      } else {
        // mark as markAsPermanent
        await service.markAsPermanent({
          name: schedule.name,
          id: schedule.id,
        });
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Schedule saved successfully",
        position: "top",
      });

      setName("");
      close();
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
      setIsScheduleSavedDirectly(true);
    }
  }, [
    isScheduleSavedDirectly,
    isScheduleSavedByActivation,
    setIsScheduleSavedDirectly,
    service,
    summaries,
    subSummaries,
    isSaving,
    name,
    close,
    buildSchedule,
  ]);

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
