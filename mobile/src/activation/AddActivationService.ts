import { ScheduleConflictError } from "../errors/scheduleActivationConflic.error";
import type { ActivationRepository } from "./ActivationRepository";
import type { ActivationContext } from "./domain/conflict/ActivationContext";
import type { ConflictDetector } from "./domain/conflict/ConflictDetector";
import type { ConflictResolver } from "./domain/conflict/ConflictResolver";

export class AddActivationService {
  constructor(
    private readonly conflictDetector: ConflictDetector,
    private readonly conflictResolver: ConflictResolver,
    private readonly activationRepository: ActivationRepository,
  ) {}

  async add(context: ActivationContext) {
    const conflicts = await this.conflictDetector.detect(context);

    if (!context.overwrite && conflicts.length > 0) {
      throw new ScheduleConflictError(
        `The activation contains ${conflicts.length} conflicts`,
        conflicts,
      );
    }

    if (context.overwrite) {
      await this.conflictResolver.resolve(conflicts, context.payload.selectedDays ?? []);
    }

    await this.activationRepository.create(context.payload);
  }
}
