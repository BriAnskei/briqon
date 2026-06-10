export const TONE: string[] = [
  "#FFB547",
  "#7B6FFF",
  "#1FD8A0",
  "#5BB8FF",
  "#FF8C69",
  "#C084FC",
  "#64748B",
];

export function toneForIndex(index: number): string {
  return TONE[index % TONE.length];
}

export function alarmForIndex(index: number): boolean {
  return index % 3 !== 2;
}
