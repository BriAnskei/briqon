import { BreakFrequency, NewScheduleFormState } from "@/type/NewScheduleTypes";
import { object } from "zod";

type ValidatorResType = {
  message?: string;
  valid: boolean;
};

export default class ScheduleFormWindowtimeRuleValidator {
  constructor(private form: NewScheduleFormState) {}

  /**Validate the priotity time input */
  public validatePriorityTimeWindow(): ValidatorResType {
    let totalWindowTime = this.getWindowMinutes();
    let overAllWindowEvent =
      this.getAppWindowMin() +
      this.getMealsWindowMin() +
      this.getBreakWindowMin();

    let remainingWindowMin = totalWindowTime - overAllWindowEvent;

    if (this.form.priorityDurationMinutes ?? 0 > remainingWindowMin) {
      return {
        valid: false,
        message:
          "There isn't enough remaining time in the schedule to fit the requested priority duration.",
      };
    }

    return { valid: true };
  }

  public validateBreakFreqWindow(): ValidatorResType {
    if (this.form.breakFrequency === "none") return { valid: true };

    const totalTimeWindow = this.getWindowMinutes();
    const totalFixedEventSchedMins =
      this.getAppWindowMin() + this.getMealsWindowMin();

    if (totalFixedEventSchedMins + this.getBreakWindowMin() > totalTimeWindow) {
      const recommendedBreakStyle = this.findApplicableBreakFreq(
        totalFixedEventSchedMins,
      );
      return {
        valid: false,
        message: `There isn't enough free time in your schedule to fit the selected break style. Use the "${recommendedBreakStyle}" break style instead`,
      };
    }

    return { valid: true };
  }

  private findApplicableBreakFreq(
    totalFixedEventSchedMins: number,
  ): NonNullable<BreakFrequency> {
    const totalTimeWindow = this.getWindowMinutes();
    const breakTypePercentage = this.getBreakPercentage();

    for (let [breakStyle, percentage] of Object.entries(breakTypePercentage)) {
      if (totalFixedEventSchedMins * percentage < totalTimeWindow) {
        return breakStyle as NonNullable<BreakFrequency>;
      }
    }
    return "none";
  }

  public validateMealWindowTime(): ValidatorResType {
    const currentWindowMin = this.getWindowMinutes() - this.getAppWindowMin();
    const mealMinutes = this.getMealsWindowMin();

    if (mealMinutes > currentWindowMin) {
      return {
        valid: false,
        message: "The total meals duration exceeds the schedule time window.",
      };
    }

    return { valid: true };
  }

  /** Validate overall duration of the appointment the time window  */
  public validateAppWindowTime(): ValidatorResType {
    const currentWindowMin = this.getWindowMinutes() - this.getMealsWindowMin();
    const appMinutes = this.getAppWindowMin();

    if (appMinutes > currentWindowMin) {
      return {
        valid: false,
        message:
          "The total appointment duration exceeds the schedule time window.",
      };
    }

    return { valid: true };
  }

  public validateWindowMinDuration(): ValidatorResType {
    const totalWindowMin = this.getWindowMinutes();

    if (totalWindowMin <= 0) {
      return {
        valid: false,
        message: "Invalid time window input",
      };
    }

    return { valid: true };
  }

  public getWindowMinutes() {
    return this.getTotalWindowMin([
      { start_time: this.form.startTime, end_time: this.form.endTime },
    ]);
  }

  private getBreakPercentage(): Record<NonNullable<BreakFrequency>, number> {
    return {
      "few-long": 0.15,
      balanced: 0.12,
      "many-short": 0.15,
      none: 0,
    };
  }

  private getBreakWindowMin() {
    const breakFreqPercentage =
      this.getBreakPercentage()[
        this.form.breakFrequency as NonNullable<BreakFrequency>
      ];

    return (
      this.getWindowMinutes() *
      (breakFreqPercentage === 0 ? 1 : breakFreqPercentage)
    );
  }

  private getAppWindowMin() {
    return this.getTotalWindowMin(
      this.form.appointments.map((app) => ({
        start_time: app.startTime,
        end_time: app.endTime,
      })) ?? 0,
    );
  }

  private getMealsWindowMin() {
    return (
      this.form.meals.reduce(
        (total, { durationMinutes }) => total + durationMinutes,
        0,
      ) ?? 0
    );
  }

  private getTotalWindowMin(schedules: { start_time: Date; end_time: Date }[]) {
    let res = 0;
    for (let { start_time, end_time } of schedules) {
      let diff = end_time.getTime() - start_time.getTime();

      if (diff < 0) diff += 24 * 60 * 60 * 1000;

      res += Math.floor(diff / (1000 * 60));
    }

    return res;
  }
}
