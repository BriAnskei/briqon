import { useState } from "react";
import { useRouter } from "expo-router";
import { useSchedule } from "@/context/ScheduleContext";

export function useScheduleReview() {
  const router = useRouter();
  const { selectedReviewItems, setSelectedReviewItems } = useSchedule();

  const [modalVisible, setModalVisible] = useState(false);

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  const handleSave = () => {
    // TODO: persist without activating
  };

  const handleConfirmActive = () => {
    // scheduling already happened inside useSetActiveModal.handleConfirm
    // this just handles post-confirm navigation
    setModalVisible(false);
    router.push("/confirmation");
  };

  return {
    scheduleItems: selectedReviewItems,
    modalVisible,
    openModal,
    closeModal,
    handleSave,
    handleConfirmActive,
    goBack: router.back,
  };
}
