import type { CreateActivationInput } from "@/type/ui/schedule/activation.types";
import type { AddActivationService } from "../activation/AddActivationService";
import type { Schedule, ScheduleItem } from "../models/schedule.model";
import type { SubSummary } from "../models/sub_summaries.model";
import type { ScheduleSummary } from "../models/summaries.model";
import type { ActiveScheduleRepository } from "../repository/activeSchedule.repo";
import type { ScheduleService } from "./schedule.service";

export class ActiveScheduleService {
  constructor(
    private readonly addActivationService: AddActivationService,
    private readonly activeScheduleRepository: ActiveScheduleRepository,
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
  async createAsync(input: CreateActivationInput) {
    if (input.scheduleItems) {
      await this.ensureScheduleSavedAsTemporary(input);
    }

    return this.addActivationService.add(input);
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
