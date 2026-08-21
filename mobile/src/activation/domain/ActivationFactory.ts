import type { CreateActivationInput } from "@/type/ui/schedule/activation.types";
import { Activation } from "./Activation";
import { ActiveScheduleDate } from "./entity/ActiveScheduleDate";
import { ActiveScheduleDays } from "./entity/ActiveScheduleDays";
import { NonOccuringWindowRange } from "./entity/NonOccuringWindowRange";
import { OccuringTimeWindow } from "./entity/OccurinngTimeWindow";

export class ActivationFactory {
  create(input: CreateActivationInput): Activation {
    const activation = Activation.create({
      scheduleId: input.scheduleId,
      activeType: input.activeType,
      reccuring: input.recurring,
    });

    if (input.activeType === "days") {
      this.handleDayTypeActivation(activation, input);
    } else if (input.activeType === "date") {
      this.handleDateTypeActivation(activation, input);
    }

    return activation;
  }

  private handleDayTypeActivation(activation: Activation, input: CreateActivationInput) {
    this.addSelectedDays(activation, input);

    if (input.recurring) {
      this.addRecurringOverflow(activation, input);
    } else {
      this.addNonRecurringRanges(activation, input);
    }
  }

  private handleDateTypeActivation(
    activation: Activation,
    input: CreateActivationInput,
  ): void {
    if (!input.selectedDate)
      throw new Error("Date type activation requires selected date");
    activation.setDate(ActiveScheduleDate.create(activation.id, input.selectedDate));

    const range = NonOccuringWindowRange.create(
      activation.id,
      0, // No need for adding days for a date type activation
      input.scheduleTimeStart,
      input.sheduleTimeEnd,
      input.nonReccuringDaysTypeStartsAt,
    );
    activation.addNonReccuringRange(range);
  }

  private addSelectedDays(activation: Activation, input: CreateActivationInput): void {
    const selectedDays = this.requireSelectedDays(input);

    for (const day of selectedDays) {
      activation.addDay(ActiveScheduleDays.create(activation.id, day));
    }
  }

  private addRecurringOverflow(
    activation: Activation,
    input: CreateActivationInput,
  ): void {
    const overflow = OccuringTimeWindow.create(
      activation.id,
      input.scheduleTimeStart,
      input.sheduleTimeEnd,
    );

    activation.setReccuringOverflow(overflow);
  }

  private addNonRecurringRanges(
    activation: Activation,
    input: CreateActivationInput,
  ): void {
    const selectedDays = this.requireSelectedDays(input);

    for (let index = 0; index < selectedDays.length; index++) {
      const range = NonOccuringWindowRange.create(
        activation.id,
        index,
        input.scheduleTimeStart,
        input.sheduleTimeEnd,
        input.nonReccuringDaysTypeStartsAt,
      );

      activation.addNonReccuringRange(range);
    }
  }

  private requireSelectedDays(input: CreateActivationInput): number[] {
    if (!input.selectedDays?.length) {
      throw new Error("No selected days detected");
    }

    return input.selectedDays;
  }
}
