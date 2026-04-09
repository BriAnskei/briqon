export function duration(start: string, end: string): string {
  if (!start || !end) return "";

  const parse = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const diff = parse(end) - parse(start);
  if (diff <= 0) return "";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatTime(time?: string): string {
  if (!time) return "";

  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr ?? "00";
  const ampm = hour >= 12 ? " PM" : " AM";

  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;

  return `${hour}:${minute}${ampm}`;
}
