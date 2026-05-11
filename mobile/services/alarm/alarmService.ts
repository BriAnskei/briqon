import NativeAlarmModule from "@/specs/NativeAlarmModule";
import { ScheduleItem } from "@/type/MessageTypes";
import { buildDates } from "./scheduleToDates";
import { DateMode } from "@/features/schedule-conversation/util/reviewHelpers";

export type AlarmConfig = {
  id: number;
  items: ScheduleItem[];
  dateMode: DateMode;
  startDay?: number;
  endDay?: number;
  specificDate?: string;
  scheduleName: string;
};

export const AlarmService = {
  /**
   * Schedules all items in a schedule.
   * Note: For repeating alarms, you should call this again when an alarm is dismissed.
   */
  syncAlarms: (config: AlarmConfig) => {
    const dates = buildDates({
      items: config.items,
      dateMode: config.dateMode,
      startDay: config.startDay,
      endDay: config.endDay,
      specificDate: config.specificDate,
    });

    // Sort dates to find chronological order
    const sorted = [...dates].sort((a, b) => a.date.getTime() - b.date.getTime());

    sorted.forEach((entry, index) => {
      const nextEntry = sorted[index + 1];
      
      // Use the config.id as a base and add index for uniqueness within this schedule
      const alarmId = config.id * 1000 + index;
      const timestamp = entry.date.getTime();

      NativeAlarmModule.setAlarm(
        alarmId,
        timestamp,
        entry.activity,
        "", // startTime - could be formatted from entry.date
        "", // endTime
        config.scheduleName,
        nextEntry?.activity ?? "",
        "" // nextStartTime
      );
    });
  },

  cancelAllAlarms: (config: AlarmConfig) => {
    // Cancel up to 100 possible sub-alarms for this schedule ID
    for (let i = 0; i < 100; i++) {
      NativeAlarmModule.cancelAlarm(config.id * 1000 + i);
    }
  },

  stopActiveAlarm: () => {
    NativeAlarmModule.stopAlarm();
  },
};
