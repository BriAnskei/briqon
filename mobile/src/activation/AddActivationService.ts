import type { CreateActivationInput } from "@/type/ui/schedule/activation.types";
import { ScheduleConflictError } from "../errors/scheduleActivationConflic.error";
import type { ActivationRepository } from "./ActivationRepository";
import type { ActivationFactory } from "./domain/ActivationFactory";
import type { ConflictDetector } from "./domain/conflict/ConflictDetector";
import type { ConflictResolver } from "./domain/conflict/ConflictResolver";

export class AddActivationService {
  constructor(
    private readonly conflictDetector: ConflictDetector,
    private readonly conflictResolver: ConflictResolver,
    private readonly activationRepository: ActivationRepository,
    private readonly activationFactory: ActivationFactory,
  ) {}

  async add(input: CreateActivationInput) {
    const context = this.activationFactory.create(input);

    const conflicts = await this.conflictDetector.detect(context);

    if (!input.overwrite && conflicts.length > 0) {
      throw new ScheduleConflictError(
        `The activation contains ${conflicts.length} conflicts`,
        conflicts,
      );
    }

    if (input.overwrite) {
      await this.conflictResolver.resolve(conflicts, context);
    }

    await this.activationRepository.execute(context);
  }
}
