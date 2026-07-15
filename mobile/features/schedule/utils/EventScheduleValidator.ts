import { NewScheduleFormState } from "@/type/NewScheduleTypes";
import { ValidatorResType } from "../types/FormValidatorTypes";
import { TimeFormatter } from "@/utils/TimeFormatter";

type TimeBlock = {
  id: string;
  label: string;
  start: Date;
  end: Date;
};

/**
 * Validates an EVENT schedule.
 *
 * Event segments carry an explicit numeric duration (minutes, optional) and
 * are either "flexible" (placed in order, no explicit time) or "fixed" (an
 * explicit start time that must not move). This validator mirrors the
 * personal validators' intent:
 *  - duration math against the schedule window (like
 *    ScheduleFormWindowtimeRuleValidator for appointments/meals)
 *  - overlap detection between fixed-time segments, and fixed segments
 *    falling within the window (like ScheduleConflictValidator)
 */
export default class EventScheduleValidator {
  constructor(private form: NewScheduleFormState) {}

  /** Total minutes across all event items that have a specified duration. */
  public getEventTotalMinutes(): number {
    return this.form.eventScheduleItems.reduce(
      (total, item) => total + (item.durationMinutes ?? 0),
      0,
    );
  }

  /**
   * The sum of every event-segment duration must fit inside the schedule
   * time window. Items without a specified duration are skipped (treated as
   * unknown), matching the personal validators' behaviour of only measuring
   * what they can measure.
   */
  public validateEventDurationWindow(): ValidatorResType {
    if (this.form.scheduleType === "personal") return { valid: true }; // no need for validation

    const totalEventMinutes = this.getEventTotalMinutes();
    if (totalEventMinutes === 0) return { valid: true };

    const windowMin = this.getWindowMinutes();

    if (totalEventMinutes > windowMin) {
      return {
        valid: false,
        message: `The total event segment duration (~${totalEventMinutes} min) exceeds the schedule time window (${windowMin} min).`,
      };
    }

    return { valid: true };
  }

  /**
   * Fixed-time segments must not overlap each other, and must fall within
   * the schedule window. A fixed segment without a specified duration is
   * treated as a zero-length point in time for overlap purposes.
   */
  public validateEventConflicts(): ValidatorResType {
    if (this.form.scheduleType === "personal") return { valid: true }; // no need for validation
    const fixedBlocks = this.getFixedTimeBlocks();

    if (fixedBlocks.length === 0) return { valid: true };












    const windowStart = TimeFormatter.getMinutesOfDay(this.form.startTime);
    // windowStart plus the full window duration. Using getWindowMinutes()
    // (which returns 1440 for an equal 00:00->00:00 "full day" window)
    // avoids normalizeMinute collapsing a 00:00 end back to 0, which made
    // every block look "outside" the window.
    const windowEnd = windowStart + this.getWindowMinutes();

    const sorted = [...fixedBlocks].sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );

    for (let i = 0; i < sorted.length; i++) {
      const block = sorted[i];
      const start = TimeFormatter.normalizeMinute(
        TimeFormatter.getMinutesOfDay(block.start),
        windowStart,
      );
      let end = TimeFormatter.normalizeMinute(
        TimeFormatter.getMinutesOfDay(block.end),
        windowStart,
      );

      // Handle a segment that crosses midnight (but not a zero-duration
      // point in time, where start === end is valid).
      if (end < start) end += 24 * 60;

      if (start < windowStart || end > windowEnd) {
        return {
          valid: false,
          message: `"${block.label}" is outside the schedule time window.`,
        };
      }

      if (i < sorted.length - 1) {
        const next = sorted[i + 1];
        if (block.end.getTime() > next.start.getTime()) {
          return {
            valid: false,
            message: `"${block.label}" conflicts with "${next.label}".`,
          };
        }
      }
    }

    return { valid: true };
  }

  /** Every event item must at least have a name. */
  public validateEventItemsPresent(): ValidatorResType {
    if (this.form.scheduleType === "personal") return { valid: true }; // no need for validation
    if (this.form.eventScheduleItems.length === 0) {
      return { valid: true };
    }

    const hasUnnamed = this.form.eventScheduleItems.some(
      (item) => !item.name.trim(),
    );

    if (hasUnnamed) {
      return {
        valid: false,
        message: "Every event segment must have a name.",
      };
    }

    return { valid: true };
  }

  public getWindowMinutes(): number {
    const { startTime, endTime } = this.form;
    let diff = endTime.getTime() - startTime.getTime();

    // Equal times (12am -> 12am) and clock-wraparound (10pm -> 6am) both mean
    // "the window extends into the next day" -- treat both as a full 24h cycle.
    if (diff <= 0) diff += 24 * 60 * 60 * 1000;

    return Math.floor(diff / (1000 * 60));
  }

  private getFixedTimeBlocks(): TimeBlock[] {
    return this.form.eventScheduleItems
      .filter((item) => item.isFixedTime && item.fixedTime)
      .map((item) => ({
        id: item.id,
        label: item.name,
        start: item.fixedTime!,
        end: new Date(
          item.fixedTime!.getTime() + (item.durationMinutes ?? 0) * 60 * 1000,
        ),
      }));
  }
}
