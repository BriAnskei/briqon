/**
 * TimeFormatter
 *
 * Single home for every time-related conversion helper that was previously
 * duplicated across validators, wizard helpers, and various components:
 *   - getMinutesOfDay / normalizeMinute   (ScheduleConflictValidator,
 *                                          EventScheduleValidator)
 *   - formatTime / formatMinutes /        (features/schedule/utils/wizardHelpers)
 *     getDurationMins / durationText
 *   - formatTime / duration               (utils/parseSchedule)
 *   - parseTime / timeToMinutes /         (utils/timeUtils)
 *     minutesToTime / addMinutes
 *   - formatDate                          (reviewHelpers, ScheduleActivedModal)
 *
 * Call sites stay terse:
 *   getMinutesOfDay(date)
 */

// ── Date → minutes-of-day ──────────────────────────────────────────────────

/** Minutes since midnight for a Date (0–1439). */
export function getMinutesOfDay(date: Date): number {
	return date.getHours() * 60 + date.getMinutes();
}

/**
 * If `minute` occurs before `windowStart`, treat it as belonging to the
 * next day (so cross-midnight times sort/compare correctly).
 */
export function normalizeMinute(minute: number, windowStart: number): number {
	if (minute < windowStart) {
		return minute + 24 * 60;
	}
	return minute;
}

// ── Date → formatted strings ───────────────────────────────────────────────

/** Format a Date as a 24-hour "HH:MM" string. */
export function formatTime(date: Date): string {
	return date.toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

/** Format a "HH:MM" string as a 12-hour "H:MM AM/PM" string. */
export function formatTime12h(time?: string): string {
	if (!time) return "";

	const [hourStr, minuteStr] = time.split(":");
	let hour = parseInt(hourStr, 10);
	const minute = minuteStr ?? "00";
	const ampm = hour >= 12 ? " PM" : " AM";

	if (hour === 0) hour = 12;
	else if (hour > 12) hour -= 12;

	return `${hour}:${minute}${ampm}`;
}

/** "Wed, Jul 13" */
export function formatDate(date: Date): string {
	return date.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
	});
}

/** "Wednesday, July 13, 2026" */
export function formatDateLong(date: Date): string {
	return date.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

// ── Minutes → human-readable duration ──────────────────────────────────────

/** 95 → "1h 35m", 60 → "1h", 45 → "45m", 0 → "0m" */
export function formatMinutes(totalMinutes: number): string {
	const mins = Math.round(totalMinutes);
	const h = Math.floor(mins / 60);
	const m = mins % 60;
	if (h === 0) return `${m}m`;
	if (m === 0) return `${h}h`;
	return `${h}h ${m}m`;
}

/** Duration in minutes between two Dates, wrapping past midnight. */
export function getDurationMins(start: Date, end: Date): number {
	let endTime = end.getTime();

	if (endTime <= start.getTime()) {
		endTime += 24 * 60 * 60 * 1000;
	}

	return (endTime - start.getTime()) / 60000;
}

/** "Duration: 1h 35m" (or an error string when end ≤ start). */
export function durationText(start: Date, end: Date): string {
	const diff = getDurationMins(start, end);
	if (diff <= 0) return "End time should be after start";
	const h = Math.floor(diff / 60);
	const m = diff % 60;
	return `Duration: ${h > 0 ? `${h}h ` : ""}${m > 0 ? `${m}m` : ""}`;
}

/** Duration between two "HH:MM" strings, e.g. ("05:30","06:00") → "30m". */
export function formatDuration(start?: string, end?: string): string {
	if (!start || !end) return "";

	const diff = timeToMinutes(end) - timeToMinutes(start);
	if (diff <= 0) return "";

	return formatMinutes(diff);
}

// ── "HH:MM" string math ────────────────────────────────────────────────────

/** "07:30 AM" → { hour: 7, minute: 30 }; "15:00" → { hour: 15, minute: 0 } */
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

/** "07:30" → 450 */
export function timeToMinutes(time: string): number {
	const { hour, minute } = parseTime(time);
	return hour * 60 + minute;
}

/** 450 → "07:30" */
export function minutesToTime(totalMinutes: number): string {
	const h = Math.floor(totalMinutes / 60) % 24;
	const m = totalMinutes % 60;
	return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/** "07:30" + 90 → "09:00" */
export function addMinutes(time: string, minutes: number): string {
	return minutesToTime(timeToMinutes(time) + minutes);
}
