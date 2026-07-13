import { MealPlacement, NewScheduleFormState } from "@/type/NewScheduleTypes";
import { ValidatorResType } from "../types/FormValidatorTypes";
import { TimeFormatter } from "@/utils/TimeFormatter";

type TimeBlock = {
  id: string;
  label: string;
  start: Date;
  end: Date;
};

export default class ScheduleConflictValidator {
  constructor(private form: NewScheduleFormState) {}

  public validateTimeConflicts(): ValidatorResType {
    const blocks = this.getTimeBlocks();

    if (blocks.length <= 1) {
      return { valid: true };
    }

    const sorted = [...blocks].sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      if (this.isOverlapping(current, next)) {
        return {
          valid: false,
          message: `"${current.label}" conflicts with "${next.label}".`,
        };
      }
    }

    return { valid: true };
  }

  public validateTimeBlocksWithinWindow(): ValidatorResType {
    const blocks = this.getTimeBlocks();

    const windowStart = TimeFormatter.getMinutesOfDay(this.form.startTime);
    const windowEnd = TimeFormatter.normalizeMinute(
      TimeFormatter.getMinutesOfDay(this.form.endTime),
      windowStart,
    );

    for (const block of blocks) {
      let start = TimeFormatter.normalizeMinute(
        TimeFormatter.getMinutesOfDay(block.start),
        windowStart,
      );

      let end = TimeFormatter.normalizeMinute(
        TimeFormatter.getMinutesOfDay(block.end),
        windowStart,
      );

      // Handle appointments/meals that cross midnight.
      if (end <= start) {
        end += 24 * 60;
      }

      if (start < windowStart || end > windowEnd) {
        return {
          valid: false,
          message: `"${block.label}" is outside the schedule time window.`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Convert appointments and fixed meals into one
   * collection of time blocks.
   */
  private getTimeBlocks(): TimeBlock[] {
    const appointments: TimeBlock[] = this.form.appointments.map((app) => ({
      id: app.id,
      label:
        app.type === "custom"
          ? app.customLabel || "Custom appointment"
          : app.type,
      start: app.startTime,
      end: app.endTime,
    }));

    const fixedMeals: TimeBlock[] = this.form.meals
      .filter((meal) => meal.placement === "fixed_time" && meal.fixedTime)
      .map((meal) => ({
        id: meal.id,
        label: meal.type,
        start: meal.fixedTime!,
        end: new Date(
          meal.fixedTime!.getTime() + meal.durationMinutes * 60 * 1000,
        ),
      }));

    return [...appointments, ...fixedMeals];
  }

  private isOverlapping(a: TimeBlock, b: TimeBlock): boolean {
    return a.end.getTime() > b.start.getTime();
  }
}
