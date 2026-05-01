export type DateMode = "today" | "tomorrow" | "range" | "specific" | null;

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const FULL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const ACCENT_COLORS = [
  "#7B6FFF",
  "#1FD8A0",
  "#FF5273",
  "#F59E0B",
  "#38BDF8",
  "#A78BFA",
  "#FB7185",
  "#34D399",
] as const;

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function offsetDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export function buildSummary(
  mode: DateMode,
  recurring: boolean,
  startDay: number,
  endDay: number,
  specificDate: Date,
): string {
  const repeatSuffix = recurring ? "· Every week" : "· One time";
  switch (mode) {
    case "today":
      return `Active today · ${formatDate(new Date())}${recurring ? " · Every week" : ""}`;
    case "tomorrow":
      return `Active tomorrow · ${formatDate(offsetDate(1))}${recurring ? " · Every week" : ""}`;
    case "range":
      return `${FULL_DAYS[startDay]} – ${FULL_DAYS[endDay]} ${repeatSuffix}`;
    case "specific":
      return `${formatDate(specificDate)} ${repeatSuffix}`;
    default:
      return "";
  }
}
