import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  setAlarm(
    timestamp: number,
    activity: string,
    startTime: string,
    endTime: string,
    scheduleName: string,
    nextActivity: string,
    nextStartTime: string,
  ): void;
  stopAlarm(): void;
  minimizeApp(): void;
  requestExactAlarmPermission(): void;
  hasExactAlarmPermission(): Promise<boolean>;
}

const AlarmModule = TurboModuleRegistry.get<Spec>("AlarmModule");

const NativeAlarmModule = {
  setAlarm: (
    timestamp: number,
    activity: string,
    startTime: string,
    endTime: string,
    scheduleName: string,
    nextActivity: string,
    nextStartTime: string,
  ): void => {
    AlarmModule?.setAlarm(
      timestamp,
      activity,
      startTime,
      endTime,
      scheduleName,
      nextActivity,
      nextStartTime,
    );
  },
  stopAlarm: (): void => {
    AlarmModule?.stopAlarm();
  },
  minimizeApp: (): void => {
    AlarmModule?.minimizeApp();
  },
  requestExactAlarmPermission: (): void => {
    AlarmModule?.requestExactAlarmPermission();
  },
  hasExactAlarmPermission: async (): Promise<boolean> => {
    return (await AlarmModule?.hasExactAlarmPermission()) ?? true;
  },
};

export default NativeAlarmModule;
