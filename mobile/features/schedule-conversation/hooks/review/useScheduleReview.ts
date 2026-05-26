import { useState } from "react";
import { useRouter } from "expo-router";
import { useSchedule } from "@/context/ScheduleContext";
import { CreateSchedule } from "@/src/models/schedule.model";
import { ScheduleService } from "@/src/service/schedule.service";
import { useToast } from "@/hooks/useToast";
import z from "zod";

let scheduleServiceInstance: ScheduleService | null = null;

export function useScheduleReview() {
  if (!scheduleServiceInstance) {
    scheduleServiceInstance = new ScheduleService();
  }

  const router = useRouter();
  const { selectedReviewItems } = useSchedule();
  const { showToast } = useToast();

  const [isScheduleAlreadySaved, setScheduleAlreadySaved] = useState(false);
  const [isSetActiveModalOpen, SetIsSetActiveModalOpen] = useState(false);

  const [isSaveScheduleModalOpen, setIsSaveScheduleModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const openSetActiveModal = () => SetIsSetActiveModalOpen(true);
  const closeSetActiveModal = () => SetIsSetActiveModalOpen(false);

  const openSaveScheduleModal = () => setIsSaveScheduleModalOpen(true);
  const closeSaveScheduleModal = () => setIsSaveScheduleModalOpen(false);

  const handleSave = async (scheduleName: string) => {
    try {
      setIsSaving(true);
      const newSchedule: CreateSchedule = {
        name: scheduleName,
        schedule_list: selectedReviewItems,
        temporary: false,
      };

      await scheduleServiceInstance?.createSchedule(newSchedule);

      showToast({
        type: "success",
        title: "Success",
        message: "Schedule saved successfully!",
      });

      closeSaveScheduleModal();
    } catch (error) {
      console.error("[useScheduleReview] Save failed:", error);

      if (error instanceof z.ZodError) {
        console.log("Zod Error: ", error.message);
      } else if (error instanceof Error) {
        console.log("Error: ", error.message);
      }

      showToast({
        type: "error",
        title: "Save Failed",
        message: "An unexpected error occurred.",
      });
    } finally {
      setIsSaving(false);
      setScheduleAlreadySaved(true);
    }
  };

  const handleConfirmActive = () => {
    // scheduling already happened inside useSetActiveModal.handleConfirm
    // this just handles post-confirm navigation
    SetIsSetActiveModalOpen(false);
    router.push("/confirmation");
  };

  return {
    scheduleItems: selectedReviewItems,
    isSetActiveModalOpen,
    openSetActiveModal,
    closeSetActiveModal,
    handleSave,
    handleConfirmActive,
    goBack: router.back,

    isSaveScheduleModalOpen,
    openSaveScheduleModal,
    closeSaveScheduleModal,

    isSaving,
    isScheduleAlreadySaved,
  };
}
