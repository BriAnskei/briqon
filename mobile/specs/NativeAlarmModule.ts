import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  setAlarm(timestamp: number): void;
  requestExactAlarmPermission(): void;
}

const AlarmModule = TurboModuleRegistry.get<Spec>("AlarmModule");

const NativeAlarmModule = {
  setAlarm: (timestamp: number): void => {
    AlarmModule?.setAlarm(timestamp);
  },
  requestExactAlarmPermission: (): void => {
    AlarmModule?.requestExactAlarmPermission();
  },
};

export default NativeAlarmModule;
