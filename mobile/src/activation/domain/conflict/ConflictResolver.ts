import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";
import type { ActiveScheduleRepository } from "@/src/repository/activeSchedule.repo";
import type { ActiveScheduleDaysRepository } from "@/src/repository/activeScheduleDays.repo";
import type { Activation } from "../Activation";

export class ConflictResolver {
  constructor(
    private readonly activeScheduleRepository: ActiveScheduleRepository,
    private readonly activeScheduleDaysRepository: ActiveScheduleDaysRepository,
  ) {}
  async resolve(conflicts: ScheduleConflict[], context: Activation): Promise<void> {
    if (context.reccuring) {
      await this.resolveOccurringActivation(conflicts, context);
    } else {
      await this.resolveForNonOccuringActivation(conflicts, context);
    }
  }

  /**
   * Resolves conflicts involving existing recurring activations.
   *
   * Recurring activations are always day-based, so their conflicts
   * are resolved using the selected days of the current activation.
   */
  private async resolveOccurringActivation(
    conflicts: ScheduleConflict[],
    context: Activation,
  ): Promise<void> {
    for (const conflict of conflicts) {
      if (!conflict.recurring) continue;
      await this.resolveDay(conflict, context.getSelectedDaysArr());
    }
  }

  /**
   * Only resolves the non occuring active conflicts
   */
  private async resolveForNonOccuringActivation(
    conflicts: ScheduleConflict[],
    context: Activation,
  ): Promise<void> {
    for (const conflict of conflicts) {
      if (conflict.recurring) continue;

      if (conflict.activeType === "date")
        await this.activeScheduleRepository.delete(conflict.id);
      else this.resolveDay(conflict, context.getSelectedDaysArr());
    }
  }

  private async resolveDay(
    conflict: ScheduleConflict,
    newActivationDays: number[],
  ): Promise<void> {
    const selectedDays = conflict.recurring
      ? (conflict.occuring?.selectedDays ?? [])
      : (conflict.nonOccuring?.selectedDays ?? []);

    const remainingDays = selectedDays.filter((d) => !newActivationDays.includes(d));

    if (remainingDays.length === 0)
      await this.activeScheduleRepository.delete(conflict.id);
    else
      await this.activeScheduleDaysRepository.removeActiveScheduleDays(
        conflict.id,
        newActivationDays,
      );
  }
}
