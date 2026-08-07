import { createContext, type ReactNode, useContext } from "react";
import type { ScheduleItem } from "@/type/MessageTypes";
import "react-native-get-random-values";
// ─── Types ────────────────────────────────────────────────────────────────────

export type EditTarget = {
  scheduleId: string;
  items: ScheduleItem[];
};

export type ScheduleContextType = {};

const ScheduleContext = createContext<ScheduleContextType | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const d = {
    ad: 3,
    b: 4,
    test: "ff",
    car: 3,
  };

  return <ScheduleContext.Provider value={{}}>{children}</ScheduleContext.Provider>;
}
export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used inside ScheduleProvider");
  return ctx;
}
