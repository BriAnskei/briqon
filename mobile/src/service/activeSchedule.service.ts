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
}
