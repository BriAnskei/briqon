import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  setAlarm(
    id: number,
    timestamp: number,
    activity: string,
    startTime: string,
    endTime: string,
    scheduleName: string,
    nextActivity: string,
    nextStartTime: string,
  ): void;
  cancelAlarm(id: number): void;
  stopAlarm(): void;
  minimizeApp(): void;
  requestExactAlarmPermission(): void;
  hasExactAlarmPermission(): Promise<boolean>;
}

const AlarmModule = TurboModuleRegistry.get<Spec>("AlarmModule");

const NativeAlarmModule = {
  setAlarm: (
    id: number,
    timestamp: number,
    activity: string,
    startTime: string,
    endTime: string,
    scheduleName: string,
    nextActivity: string,
    nextStartTime: string,
  ): void => {
    AlarmModule?.setAlarm(
      id,
      timestamp,
      activity,
      startTime,
      endTime,
      scheduleName,
      nextActivity,
      nextStartTime,
    );
  },
  cancelAlarm: (id: number): void => {
    AlarmModule?.cancelAlarm(id);
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
