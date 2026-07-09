import { NewScheduleFormState } from "@/type/NewScheduleTypes";
import { ValidatorResType } from "../types/FormValidatorTypes";

type ParsedDuration = {
  raw: string;
  minutes: number | null; // null when the free-text duration can't be parsed
};

/**
 * Validates an EVENT schedule.
 *
 * Event segments are user-entered items with a free-text duration
 * (e.g. "30 min", "1 hr 30 min"), unlike personal appointments/meals which
 * carry explicit Date/number durations. This validator mirrors the personal
 * validators' intent:
 *  - duration math against the schedule window (like
 *    ScheduleFormWindowtimeRuleValidator for appointments/meals)
 *  - "do the segments fit / overrun" detection (like the conflict validator's
 *    overlap detection, adapted to sequential, timeless segments)
 *
 * Because event durations are free text, a duration we can't parse is treated
 * as "unknown" and skipped rather than failing the whole schedule — matching
 * the personal validators' behaviour of only measuring what they can measure.
 */
export default class EventScheduleValidator {
  constructor(private form: NewScheduleFormState) {}

  /** Total minutes across all event items whose duration we could parse. */
  public getEventTotalMinutes(): number {
    return this.parseAllDurations().reduce(
      (total, parsed) => total + (parsed.minutes ?? 0),
      0,
    );
  }

  /**
   * The sum of every parseable event-segment duration must fit inside the
   * schedule time window. Unparseable durations are skipped (treated as
   * unknown), so free text like "TBD" never blocks the schedule.
   */
  public validateEventDurationWindow(): ValidatorResType {
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
   * Event items have no explicit start/end times, so a "conflict" is when the
   * parseable segments, placed back-to-back in order, run past the end of the
   * schedule window. When fewer than two segments are measurable there is
   * nothing to overrun, so it passes.
   */
  public validateEventConflicts(): ValidatorResType {
    const measurable = this.parseAllDurations().filter(
      (parsed) => parsed.minutes !== null,
    );

    if (measurable.length <= 1) return { valid: true };

    const windowMin = this.getWindowMinutes();
    let running = 0;
    for (const parsed of measurable) {
      running += parsed.minutes as number;
      if (running > windowMin) {
        return {
          valid: false,
          message:
            "The event segments run longer than the schedule window when placed back-to-back.",
        };
      }
    }

    return { valid: true };
  }

  /** Every event item must at least have a name. */
  public validateEventItemsPresent(): ValidatorResType {
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

  private parseAllDurations(): ParsedDuration[] {
    return this.form.eventScheduleItems.map((item) =>
      this.parseDuration(item.duration),
    );
  }

  /**
   * Parse a free-text duration such as "30 min", "1 hr", "1h 30m", "2 hours".
   * Returns `minutes: null` for anything that can't be parsed, so unparseable
   * input never blocks a schedule.
   */
  private parseDuration(raw: string): ParsedDuration {
    const text = (raw ?? "").trim().toLowerCase();
    if (!text) return { raw: text, minutes: null };

    const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/);
    const minMatch = text.match(
      /(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)\b/,
    );

    let minutes = 0;
    let matched = false;

    if (hourMatch) {
      minutes += parseFloat(hourMatch[1]) * 60;
      matched = true;
    }
    if (minMatch) {
      minutes += parseFloat(minMatch[1]);
      matched = true;
    }

    // A bare number like "45" is interpreted as minutes.
    if (!matched) {
      const bare = text.match(/^(\d+(?:\.\d+)?)$/);
      if (bare) {
        minutes += parseFloat(bare[1]);
        matched = true;
      }
    }

    return {
      raw: text,
      minutes: matched ? Math.round(minutes) : null,
    };
  }
}
