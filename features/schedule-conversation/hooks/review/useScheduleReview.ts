import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { ScheduleService } from "@/src/service/schedule.service";
import { useRouter } from "expo-router";
import { useSchedule } from "@/context/ScheduleContext";
import { CreateSchedule } from "@/src/models/schedule.model";
import { CreateActiveSchedule } from "@/src/models/active_schedule.model";

export function useScheduleReview() {
  const router = useRouter();
  const { selectedReviewItems } = useSchedule();
  const { showToast } = useToast();
  const scheduleService = new ScheduleService();

  // UI state flags
  const [isScheduleAlreadySaved, setScheduleAlreadySaved] = useState(false);
  const [isSetActiveModalOpen, SetIsSetActiveModalOpen] = useState(false);
  const [isSchedActivatedModalOpen, setIsSchedActivatedModalOpen] = useState(false);
  const [lastActiveSchedule, setLastActiveSchedule] = useState<CreateActiveSchedule | null>(null);
  const [lastSchedule, setLastSchedule] = useState<CreateSchedule | null>(null);
  const [isSaveScheduleModalOpen, setIsSaveScheduleModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Active schedule modal helpers
  const openSetActiveModal = () => SetIsSetActiveModalOpen(true);
  const closeSetActiveModal = () => SetIsSetActiveModalOpen(false);

  // Save Schedule modal helpers
  const openSaveScheduleModal = () => setIsSaveScheduleModalOpen(true);
  const closeSaveScheduleModal = () => {
    setIsSaveScheduleModalOpen(false);
  };

  // Handles persisting a schedule via the service.
  const handleSave = async (scheduleName: string) => {
    setIsSaving(true);
    try {
      await scheduleService.createSchedule({
        name: scheduleName,
        schedule_list: selectedReviewItems,
        temporary: false,
      });
      showToast({
        type: "success",
        title: "Success",
        message: "Schedule saved successfully!",
      });
      setIsSaveScheduleModalOpen(false);
    } catch (err) {
      showToast({
        type: "error",
        title: "Save Failed",
        message: "An unexpected error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmActive = (
    activeSchedule: CreateActiveSchedule,
    createSchedule: CreateSchedule,
  ) => {
    console.log("active schedule: ", JSON.stringify(activeSchedule, null, 2));
    console.log("create schedule: ", JSON.stringify(createSchedule, null, 2));
    setLastActiveSchedule(activeSchedule);
    setLastSchedule(createSchedule);
  };

  return {
    scheduleItems: selectedReviewItems,
    isSetActiveModalOpen,
    openSetActiveModal,
    closeSetActiveModal,
    handleConfirmActive,
    goBack: router.back,
    isSaveScheduleModalOpen,
    openSaveScheduleModal,
    closeSaveScheduleModal,
    isSaving,
    handleSave,
    isScheduleAlreadySaved,
    isSchedActivatedModalOpen,
    setIsSchedActivatedModalOpen,
    lastActiveSchedule,
    lastSchedule,
    goHome: () => router.replace("/"),
  };
}
