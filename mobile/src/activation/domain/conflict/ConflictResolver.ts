import type { ScheduleConflict } from "@/src/errors/scheduleActivationConflic.error";
import type { ActiveScheduleRepository } from "@/src/repository/activeSchedule.repo";
import type { ActiveScheduleDaysRepository } from "@/src/repository/activeScheduleDays.repo";

export class ConflictResolver {
  constructor(
    private readonly activeScheduleRepository: ActiveScheduleRepository,
    private readonly activeScheduleDaysRepository: ActiveScheduleDaysRepository,
  ) {}
  async resolve(
    conflicts: ScheduleConflict[],
    newActiveScheduleDays: number[],
  ): Promise<void> {
    for (const conflict of conflicts) {
      if (conflict.activeType === "date") {
        await this.activeScheduleRepository.delete(conflict.id);
        continue;
      }

      if (conflict.activeType === "days") {
        const remainingDays = (conflict.selectedDays ?? []).filter(
          (day) => !newActiveScheduleDays.includes(day),
        );

        if (remainingDays.length === 0)
          await this.activeScheduleRepository.delete(conflict.id);
        else
          await this.activeScheduleDaysRepository.removeActiveScheduleDays(
            conflict.id,
            newActiveScheduleDays,
          );
      }
    }
  }
}
