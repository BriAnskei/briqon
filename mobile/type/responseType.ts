export type Category =
  | "wake"
  | "work"
  | "fitness"
  | "study"
  | "meal"
  | "rest"
  | "wind-down";

export type ScheduleItem = {
  id: string;
  startTime?: string;
  endTime?: string;
  activity?: string;
};

export const CATEGORY_COLORS: Record<Category, string> = {
  wake: "#FFB547",
  work: "#7B6FFF",
  fitness: "#1FD8A0",
  study: "#5BB8FF",
  meal: "#FF8C69",
  rest: "#C084FC",
  "wind-down": "#64748B",
};

// export const DEFAULT_SCHEDULE: ScheduleItem[] = [
//   {
//     id: "1",
//     title: "Wake Up & Morning Prep",
//     subtitle: "Hydrate, freshen up, light stretch",
//     time: "05:30 AM",
//     endTime: "06:00 AM",
//     icon: "🌅",
//     category: "wake",
//     alarmEnabled: true,
//   },
//   {
//     id: "2",
//     title: "Work Session",
//     subtitle: "Deep focus — professional tasks",
//     time: "06:00 AM",
//     endTime: "03:00 PM",
//     icon: "💼",
//     category: "work",
//     alarmEnabled: true,
//   },
//   {
//     id: "3",
//     title: "Lunch Break",
//     subtitle: "Nourishing meal + short walk",
//     time: "12:00 PM",
//     endTime: "01:00 PM",
//     icon: "🥗",
//     category: "meal",
//     alarmEnabled: true,
//   },
//   {
//     id: "4",
//     title: "Post-Work Transition",
//     subtitle: "Transit to gym + quick cool-down",
//     time: "03:00 PM",
//     endTime: "03:30 PM",
//     icon: "🚶",
//     category: "rest",
//     alarmEnabled: false,
//   },
//   {
//     id: "5",
//     title: "Gym Session",
//     subtitle: "Full 2-hour training block",
//     time: "03:30 PM",
//     endTime: "05:30 PM",
//     icon: "🏋️",
//     category: "fitness",
//     alarmEnabled: true,
//   },
//   {
//     id: "6",
//     title: "Post-Gym Recovery",
//     subtitle: "Protein meal + shower + relax",
//     time: "05:30 PM",
//     endTime: "06:30 PM",
//     icon: "🍳",
//     category: "meal",
//     alarmEnabled: false,
//   },
//   {
//     id: "7",
//     title: "Programming Study",
//     subtitle: "Deep learning — upskilling block",
//     time: "06:30 PM",
//     endTime: "09:30 PM",
//     icon: "💻",
//     category: "study",
//     alarmEnabled: true,
//   },
//   {
//     id: "8",
//     title: "Wind Down & Sleep Prep",
//     subtitle: "Screen off, journal, sleep by 10:30",
//     time: "09:30 PM",
//     endTime: "10:30 PM",
//     icon: "🌙",
//     category: "wind-down",
//     alarmEnabled: true,
//   },
// ];

// // Simulates AI re-scheduling when user says "move gym to 5pm"
// export const GYM_MOVED_SCHEDULE: ScheduleItem[] = [
//   {
//     id: "1",
//     title: "Wake Up & Morning Prep",
//     subtitle: "Hydrate, freshen up, light stretch",
//     time: "05:30 AM",
//     endTime: "06:00 AM",
//     icon: "🌅",
//     category: "wake",
//     alarmEnabled: true,
//   },
//   {
//     id: "2",
//     title: "Work Session",
//     subtitle: "Deep focus — professional tasks",
//     time: "06:00 AM",
//     endTime: "03:00 PM",
//     icon: "💼",
//     category: "work",
//     alarmEnabled: true,
//   },
//   {
//     id: "3",
//     title: "Lunch Break",
//     subtitle: "Nourishing meal + short walk",
//     time: "12:00 PM",
//     endTime: "01:00 PM",
//     icon: "🥗",
//     category: "meal",
//     alarmEnabled: true,
//   },
//   {
//     id: "4",
//     title: "Post-Work Free Time",
//     subtitle: "Rest, light reading or nap",
//     time: "03:00 PM",
//     endTime: "05:00 PM",
//     icon: "☕",
//     category: "rest",
//     alarmEnabled: false,
//     isChanged: true,
//   },
//   {
//     id: "5",
//     title: "Gym Session",
//     subtitle: "Full 2-hour training block",
//     time: "05:00 PM",
//     endTime: "07:00 PM",
//     icon: "🏋️",
//     category: "fitness",
//     alarmEnabled: true,
//     isChanged: true,
//   },
//   {
//     id: "6",
//     title: "Post-Gym Recovery",
//     subtitle: "Protein meal + shower + relax",
//     time: "07:00 PM",
//     endTime: "07:45 PM",
//     icon: "🍳",
//     category: "meal",
//     alarmEnabled: false,
//     isChanged: true,
//   },
//   {
//     id: "7",
//     title: "Programming Study",
//     subtitle: "Deep learning — upskilling block",
//     time: "07:45 PM",
//     endTime: "10:00 PM",
//     icon: "💻",
//     category: "study",
//     alarmEnabled: true,
//     isChanged: true,
//   },
//   {
//     id: "8",
//     title: "Wind Down & Sleep Prep",
//     subtitle: "Screen off, journal, sleep by 11",
//     time: "10:00 PM",
//     endTime: "11:00 PM",
//     icon: "🌙",
//     category: "wind-down",
//     alarmEnabled: true,
//   },
// ];
