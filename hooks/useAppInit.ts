import { restoreAlarms } from "@/services/alarm/alarmService";
import { createChannel } from "@/services/alarm/notificationService";
import { initDb } from "@/src/database/db";
import { useEffect } from "react";

export function useAppInit() {
  useEffect(() => {
    async function init() {
      initDb();
      await createChannel();
      await restoreAlarms();
    }
    init();
  }, []);
}
