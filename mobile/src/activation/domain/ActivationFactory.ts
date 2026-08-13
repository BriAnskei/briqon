import { CreateActivationInput } from "@/type/ui/schedule/activation.types";
import { Activation } from "./Activation";
import { ActiveScheduleDays } from "./entity/ActiveScheduleDays";

export class ActivationFactory {
  create(input: CreateActivationInput): Activation {
    const activation = Activation.create({
      scheduleId: input.scheduleId,
      activeType: input.activeType,
      reccuring: input.recurring,
    });

    if (input.activeType === "days") {
      for (let day of input.selectedDays ?? []) {
        const activeDay = ActiveScheduleDays.create(activation.id, day);
        activation.addDay(activeDay);
      }

      if (input.recurring) {
      }
    }

    return activation;
  }
}
