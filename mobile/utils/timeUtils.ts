// "07:30 AM" → { hour: 7, minute: 30 }
// "03:00 PM" → { hour: 15, minute: 0 }
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
