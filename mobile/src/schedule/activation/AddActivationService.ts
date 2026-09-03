import type { CreateActivationInput } from "@/type/ui/schedule/activation.types";
import { ScheduleConflictError } from "../errors/scheduleActivationConflic.error";
import type { ScheduleService } from "../service/schedule.service";
import type { ActivationRepository } from "./ActivationRepository";
import type { ActivationFactory } from "./domain/ActivationFactory";
import type { ConflictDetector } from "./domain/conflict/ConflictDetector";
import type { ConflictResolver } from "./domain/conflict/ConflictResolver";

export class AddActivationService {
  constructor(
    private readonly conflictDetector: ConflictDetector,
    private readonly conflictResolver: ConflictResolver,
    private readonly activationFactory: ActivationFactory,
    private readonly activationRepository: ActivationRepository,
    private readonly scheduleService: ScheduleService,
  ) {}

  /**
   * Creates an activation for a schedule.
   *
   * If the schedule has not yet been persisted (detected via the optional
   * scheduleItems field on the input), it is first saved as **temporary**
   * before the activation record is created.  This allows the user to set
   * a schedule active before formally saving it; a later "Save" action will
   * simply flip the schedule from temporary → permanent (see
   * ScheduleService.markAsPermanent).
   */
  async add(input: CreateActivationInput) {
    await this.ensureScheduleExists(input);

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

  private async ensureScheduleExists(input: CreateActivationInput): Promise<void> {
    if (!input.scheduleItems) {
      return;
    }

    await this.scheduleService.ensureTemporarySchedule({
      id: input.scheduleId,
      items: input.scheduleItems,
      summaries: input.summaries,
      subSummaries: input.subSummaries,
    });
  }
}
