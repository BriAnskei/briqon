import React, {
	createContext,
	useContext,
	useState,
	useRef,
	ReactNode,
	useCallback,
} from "react";
import { MessageTypes, ScheduleItem } from "../type/MessageTypes";

import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

import { NewScheduleFormState } from "@/type/NewScheduleTypes";
import { useRouter } from "expo-router";

import { AiInstance } from "@/src/ai/ai.instance";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EditTarget = {
	scheduleId: string;
	items: ScheduleItem[];
};

type ScheduleContextType = {};

const ScheduleContext = createContext<ScheduleContextType | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
	return (
		<ScheduleContext.Provider value={{}}>{children}</ScheduleContext.Provider>
	);
}
export function useSchedule() {
	const ctx = useContext(ScheduleContext);
	if (!ctx) throw new Error("useSchedule must be used inside ScheduleProvider");
	return ctx;
}
