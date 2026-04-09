export type ScheduleItem = {
  start_time?: string;
  end_time?: string;
  activity?: string;
};
export type MessageTypes =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "ai"; type: "chat"; text: string }
  | { id: string; role: "ai"; type: "schedule"; items: ScheduleItem[] }
  | { id: string; role: "ai"; type: "loading" };
