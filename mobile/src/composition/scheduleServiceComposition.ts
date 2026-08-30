import { ScheduleRepository } from "../repository/schedule.repository";
import { SubSummariesRepository } from "../repository/subSummary.repo";
import { SummariesRepository } from "../repository/summaries.repo";
import { ScheduleService } from "../service/schedule.service";

export const scheduleService = new ScheduleService(
  new ScheduleRepository(),
  new SummariesRepository(),
  new SubSummariesRepository(),
);
