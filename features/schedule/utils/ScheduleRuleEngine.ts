import { NewScheduleFormState } from "@/type/NewScheduleTypes";

export default class ScheduleRuleEngine {
  constructor(private form: NewScheduleFormState) {}

  public getWindowMinutes() {
    let diff = this.form.endTime.getTime() - this.form.startTime.getTime();

    if (diff < 0) {
      diff += 24 * 60 * 60 * 1000;
    }
    return Math.floor(diff / (1000 * 60));
  }
}
