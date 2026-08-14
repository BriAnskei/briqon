import type { CreateActivationInput } from "@/type/ui/schedule/activation.types";
import { Activation } from "./Activation";
import { ActiveScheduleDays } from "./entity/ActiveScheduleDays";
import { OccuringOverflow } from "./entity/OccuringOverflow";

export class ActivationFactory {
  create(input: CreateActivationInput): Activation {
    const activation = Activation.create({
      scheduleId: input.scheduleId,
      activeType: input.activeType,
      reccuring: input.recurring,
    });

    if (input.activeType === "days") {
      if (!input.selectedDays || input.selectedDays.length === 0)
        throw new Error("No selected days detected");

      for (const day of input.selectedDays) {
        const activeDay = ActiveScheduleDays.create(activation.id, day);
        activation.addDay(activeDay);
      }

      if (input.recurring) {
        const occuringOverflow = OccuringOverflow.create(
          activation.id,
          input.scheduleTimeStart,
          input.sheduleTimeEnd,
        );
        activation.setReccuringOverflow(occuringOverflow);
      } else {
        
}
      
    }

    return activation;
  }
}
