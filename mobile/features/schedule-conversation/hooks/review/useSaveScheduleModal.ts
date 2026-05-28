import { useState } from "react";
import { useSchedule } from "@/context/ScheduleContext";
import { CreateSchedule } from "@/src/models/schedule.model";
import { ScheduleService } from "@/src/service/schedule.service";
import { useToast } from "@/hooks/useToast";
import z from "zod";

let scheduleServiceInstance: ScheduleService | null = null;

interface UseSaveScheduleModalOptions {
  onSuccess: () => void;
}

export function useSaveScheduleModal({ onSuccess }: UseSaveScheduleModalOptions) {
  if (!scheduleServiceInstance) {
    scheduleServiceInstance = new ScheduleService();
  }

  const { selectedReviewItems } = useSchedule();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

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

      onSuccess();
    } catch (error) {
      console.error("[useSaveScheduleModal] Save failed:", error);

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
    }
  };

  return {
    handleSave,
    isSaving,
  };
}
