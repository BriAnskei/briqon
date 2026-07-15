import { BreakFrequency, NewScheduleFormState } from "@/type/NewScheduleTypes";
import { object } from "zod";
import { ValidatorResType } from "../types/FormValidatorTypes";

export default class ScheduleFormWindowtimeRuleValidator {
  constructor(private form: NewScheduleFormState) {}

  public getAppointmentsTotalMinutes(): number {
    return this.getAppWindowMin();
  }

  public getMealsTotalMinutes(): number {
    return this.getMealsWindowMin();
  }

  public getPersonalOverallMinutes(): number {
    return this.getAppWindowMin() + this.getMealsWindowMin();
  }

  /**Validate the priotity time input */
  public validatePriorityTimeWindow(): ValidatorResType {
    let totalWindowTime = this.getWindowMinutes();
    let overAllWindowEvent =
      this.getAppWindowMin() +
      this.getMealsWindowMin() +
      this.getBreakWindowMin();

    let remainingWindowMin = totalWindowTime - overAllWindowEvent;

    if ((this.form.priorityDurationMinutes ?? 0) > remainingWindowMin) {
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
      if (
        totalFixedEventSchedMins + totalTimeWindow * percentage <
        totalTimeWindow
      ) {
        return breakStyle as NonNullable<BreakFrequency>;
      }
    }
    return "none";
  }

  public validateMealWindowTime(): ValidatorResType {
    const totalMealsMinutes = this.getMealsTotalMinutes();
    if (totalMealsMinutes === 0) return { valid: true };

    const windowMin = this.getWindowMinutes();
    const fixedSched =
      this.getMealsWindowMin() + this.getAppointmentsTotalMinutes();

    if (fixedSched > windowMin) {
      return {
        valid: false,
        message: "The total meals duration exceeds the schedule time window.",
      };
    }

    return { valid: true };
  }

  /** Validate overall duration of the appointment the time window  */
  public validateAppWindowTime(): ValidatorResType {
    const totalAppointmentMinutes = this.getAppWindowMin();
    if (totalAppointmentMinutes === 0) return { valid: true };

    const windowMin = this.getWindowMinutes();
    const fixedSched = totalAppointmentMinutes + this.getMealsWindowMin();

    if (fixedSched > windowMin) {
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
    const { startTime, endTime } = this.form;
    let diff = endTime.getTime() - startTime.getTime();

    // Equal times (12am → 12am) and clock-wraparound (10pm → 6am) both mean
    // "the window extends into the next day" — treat both as a full 24h cycle.
    if (diff <= 0) diff += 24 * 60 * 60 * 1000;

    return Math.floor(diff / (1000 * 60));
  }

  private getBreakPercentage(): Record<NonNullable<BreakFrequency>, number> {
    return {
      "few-long": 0.15,
      balanced: 0.12,
      "many-short": 0.09,
      none: 0,
    };
  }

  public getBreakWindowMin() {
    const breakFreqPercentage =
      this.getBreakPercentage()[
        this.form.breakFrequency as NonNullable<BreakFrequency>
      ];

    return this.getWindowMinutes() * breakFreqPercentage;
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
