import type { ScheduleItem } from "@/type/MessageTypes";
import type { CreateActivationInput } from "@/type/ui/schedule/activation.types";
import { ScheduleConflictError } from "../errors/scheduleActivationConflic.error";
import type { Schedule } from "../models/schedule.model";
import type { SubSummary } from "../models/sub_summaries.model";
import type { ScheduleSummary } from "../models/summaries.model";
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
    if (input.scheduleItems) {
      await this.ensureScheduleSavedAsTemporary(input);
    }

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

  /**
   * Persists the schedule (and its summaries) as a temporary row so that
   * the FK from `active_schedules → schedules` is satisfied.
   * If the schedule already exists in the DB we skip the insert – this
   * handles the retry-after-conflict case where the schedule was already
   * saved on a previous attempt.
   */
  private async ensureScheduleSavedAsTemporary(
    input: CreateActivationInput,
  ): Promise<void> {
    const exists = await this.scheduleService.exists(input.scheduleId);
    if (exists) return;

    const schedule: Schedule = {
      id: input.scheduleId,
      name: "",
      schedule_list: input.scheduleItems as ScheduleItem[],
      temporary: true,
    };

    await this.scheduleService.createSchedule({
      schedule,
      summaries: input.summaries as ScheduleSummary[],
      subSummaries: input.subSummaries as SubSummary[],
    });
  }
}
