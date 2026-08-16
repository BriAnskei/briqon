import type { CreateActivationInput } from "@/type/ui/schedule/activation.types";
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
    console.log(context.getDays());
    console.log(context);
    console.log(
      context.getNonReccuringRanges().map((range) => ({
        id: range.id,
        activeId: range.activeId,
        startsAt: range.startsAt.toISOString(),
        endsAt: range.endsAt.toISOString(),
      })),
    );

    // const conflicts = await this.conflictDetector.detect(context);

    // if (!context.overwrite && conflicts.length > 0) {
    //   throw new ScheduleConflictError(
    //     `The activation contains ${conflicts.length} conflicts`,
    //     conflicts,
    //   );
    //}

    // if (context.overwrite) {
    //   await this.conflictResolver.resolve(conflicts, context.payload.selectedDays ?? []);
    // }

    // await this.activationRepository.create(context.payload);
  }
}
