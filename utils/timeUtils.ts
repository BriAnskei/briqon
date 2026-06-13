// "07:30 AM" → { hour: 7, minute: 30 }
// "03:00 PM" → { hour: 15, minute: 0 }
// "07:30" → { hour: 7, minute: 30 } (24h)
export function parseTime(time: string): { hour: number; minute: number } {
  const upper = time.trim().toUpperCase();
  const isPM = upper.includes("PM");
  const isAM = upper.includes("AM");

  const cleaned = upper.replace(/AM|PM/, "").trim();
  let [hour, minute] = cleaned.split(":").map(Number);

  if (isPM && hour !== 12) hour += 12;
  if (isAM && hour === 12) hour = 0;

  return { hour, minute };
}

export function timeToMinutes(time: string): number {
  const { hour, minute } = parseTime(time);
  return hour * 60 + minute;
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function addMinutes(time: string, minutes: number): string {
  return minutesToTime(timeToMinutes(time) + minutes);
}
