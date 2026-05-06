import { DateMode } from "@/features/schedule-conversation/util/reviewHelpers";
import { ScheduleItem } from "@/type/MessageTypes";
import { parseTime } from "@/utils/timeUtils";

const DAY_MAP: Record<number, number> = {
  //  startDay 0=Mon, JS getDay() 0=Sun
  0: 1,
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
  6: 0,
};

export function buildDates({
  items,
  dateMode,
  startDay,
  endDay,
  specificDate,
}: {
  items: ScheduleItem[];
  dateMode: DateMode;
  startDay?: number;
  endDay?: number;
  specificDate?: string;
}): { date: Date; activity: string }[] {
  const now = new Date();
  const results: { date: Date; activity: string }[] = [];

  const baseDates = getBaseDates({
    dateMode,
    startDay,
    endDay,
    specificDate,
    now,
  });

  for (const baseDate of baseDates) {
    for (const item of items) {
      if (!item.start_time || !item.activity) continue;

      const { hour, minute } = parseTime(item.start_time);
      const alarmDate = new Date(baseDate);
      alarmDate.setHours(hour, minute, 0, 0);

      // skip alarms already in the past
      if (alarmDate <= now) continue;

      results.push({ date: alarmDate, activity: item.activity });
    }
  }

  return results;
}

function getBaseDates({
  dateMode,
  startDay,
  endDay,
  specificDate,
  now,
}: {
  dateMode: DateMode;
  startDay?: number;
  endDay?: number;
  specificDate?: string;
  now: Date;
}): Date[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (dateMode === "today") return [today];

  if (dateMode === "tomorrow") {
    const tom = new Date(today);
    tom.setDate(tom.getDate() + 1);
    return [tom];
  }

  if (dateMode === "specific" && specificDate) {
    const d = new Date(specificDate);
    d.setHours(0, 0, 0, 0);
    return [d];
  }

  if (dateMode === "range" && startDay !== undefined && endDay !== undefined) {
    // find the next occurrence of startDay and every day until endDay
    const dates: Date[] = [];
    const todayJS = today.getDay(); // 0=Sun
    const startJS = DAY_MAP[startDay];
    const endJS = DAY_MAP[endDay];

    // how many days is startDay from today?
    let daysUntilStart = (startJS - todayJS + 7) % 7;
    if (daysUntilStart === 0) daysUntilStart = 0; // same day is fine

    // range can wrap around week (e.g. Fri–Mon = Fri,Sat,Sun,Mon)
    let rangeLength = ((endJS - startJS + 7) % 7) + 1;

    for (let i = 0; i < rangeLength; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + daysUntilStart + i);
      dates.push(d);
    }
    return dates;
  }

  return [today];
}
