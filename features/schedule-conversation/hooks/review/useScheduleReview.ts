import { useState } from "react";
import { useRouter } from "expo-router";
import { useSchedule } from "@/context/ScheduleContext";
import { CreateSchedule } from "@/src/models/schedule.model";
import { CreateActiveSchedule } from "@/src/models/active_schedule.model";

export function useScheduleReview() {
  const router = useRouter();
  const { selectedReviewItems } = useSchedule();

  const [isScheduleAlreadySaved, setScheduleAlreadySaved] = useState(false);
  const [isSetActiveModalOpen, SetIsSetActiveModalOpen] = useState(false);

  const [isSchedActivatedModalOpen, setIsSchedActivatedModalOpen] =
    useState(false);
  const [lastActiveSchedule, setLastActiveSchedule] =
    useState<CreateActiveSchedule | null>(null);
  const [lastSchedule, setLastSchedule] = useState<CreateSchedule | null>(null);

  const [isSaveScheduleModalOpen, setIsSaveScheduleModalOpen] = useState(false);

  // Active schedule modal
  const openSetActiveModal = () => SetIsSetActiveModalOpen(true);
  const closeSetActiveModal = () => SetIsSetActiveModalOpen(false);

  // Save Schedule modal
  const openSaveScheduleModal = () => setIsSaveScheduleModalOpen(true);
  const closeSaveScheduleModal = () => {
    setIsSaveScheduleModalOpen(false);
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

    isScheduleAlreadySaved,

    isSchedActivatedModalOpen,
    setIsSchedActivatedModalOpen,
    lastActiveSchedule,
    lastSchedule,

    goHome: () => router.replace("/"),
  };
}
