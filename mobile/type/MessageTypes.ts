export type ScheduleItem = {
  id: string;
  startTime?: string;
  endTime?: string;
  activity?: string;
};

export type MessageTypes =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "ai"; type: "chat"; text: string }
  | { id: string; role: "ai"; type: "schedule"; items: ScheduleItem[] };
