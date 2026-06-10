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

export function calculateActiveDays(
  mode: DateMode,
  selectedDays: number[],
): number[] {
  const today = new Date();
  const toMonBased = (jsDay: number) => (jsDay === 0 ? 6 : jsDay - 1);

  switch (mode) {
    case "today":
      return [toMonBased(today.getDay())];
    case "tomorrow": {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return [toMonBased(tomorrow.getDay())];
    }
    case "range":
      return [...selectedDays].sort((a, b) => a - b);
    default:
      return [];
  }
}

export function buildSummary(
  mode: DateMode,
  recurring: boolean,
  selectedDays: number[],
  specificDate: Date,
): string {
  const repeatSuffix = recurring ? "· Every week" : "· One time";
  switch (mode) {
    case "today":
      return `Active today · ${formatDate(new Date())}${recurring ? " · Every week" : ""}`;
    case "tomorrow":
      return `Active tomorrow · ${formatDate(offsetDate(1))}${recurring ? " · Every week" : ""}`;
    case "range": {
      if (selectedDays.length === 0) return `No days selected ${repeatSuffix}`;
      const sorted = [...selectedDays].sort((a, b) => a - b);
      const labels = sorted.map((d) => FULL_DAYS[d]).join(", ");
      return `${labels} ${repeatSuffix}`;
    }
    case "specific":
      return `${formatDate(specificDate)} ${repeatSuffix}`;
    default:
      return "";
  }
}
