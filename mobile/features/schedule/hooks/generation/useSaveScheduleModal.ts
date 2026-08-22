import { useCallback, useMemo, useState } from "react";
import Toast from "react-native-toast-message";
import useModal from "@/hooks/useModal";
import type { ScheduleItem } from "@/src/models/schedule.model";
import type { SubSummary } from "@/src/models/sub_summaries.model";
import type { ScheduleSummary } from "@/src/models/summaries.model";
import { ScheduleService } from "@/src/service/schedule.service";

const useSaveScheduleModal = (payload: {
  summaries: ScheduleSummary[];
  subSummaries: SubSummary[];
  scheduleItem: ScheduleItem[];
  generatedScheduleId?: string;
  isScheduleSavedDirectly: boolean;
  setIsScheduleSavedDirectly: (b: boolean) => void;
}) => {
  const {
    summaries,
    subSummaries,
    scheduleItem,
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

  const handleSaveSchedule = useCallback(async () => {
    if (isSaving || name.length === 0) return;

    // If the schedule was already saved directly (permanent), there is nothing
    // more to do.
    if (isScheduleSavedDirectly) {
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
      // The domain layer decides whether to create a new permanent schedule
      // or promote an existing temporary one (saved during "Set Active")
      // to permanent. The UI only provides the payload.
      await service.saveSchedule({
        id: generatedScheduleId!,
        name,
        scheduleItems: scheduleItem,
        summaries,
        subSummaries,
      });

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
    service,
    summaries,
    subSummaries,
    isSaving,
    name,
    close,
    generatedScheduleId,
    scheduleItem,
    setIsScheduleSavedDirectly,
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
