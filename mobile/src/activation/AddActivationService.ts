import { ScheduleConflictError } from "../errors/scheduleActivationConflic.error";
import { ActivationRepository } from "./ActivationRepository";
import { ActivationContext } from "./conflict/ActivationContext";
import { ConflictDetector } from "./conflict/ConflictDetector";
import { ConflictResolver } from "./conflict/ConflictResolver";

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
