import { useState } from "react";
import { useRouter } from "expo-router";
import { useSchedule } from "@/context/ScheduleContext";

export function useScheduleReview() {
  const router = useRouter();
  const { selectedReviewItems } = useSchedule();

  const [modalVisible, setModalVisible] = useState(false);

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  const handleSave = () => {
    // TODO: persist schedule
  };

  const handleConfirmActive = () => {
    setModalVisible(false);
    router.push("/confirmation");
  };

  return {
    // real data staged by useConversationScreen before navigating
    scheduleItems: selectedReviewItems,
    modalVisible,
    openModal,
    closeModal,
    handleSave,
    handleConfirmActive,
    goBack: router.back,
  };
}
