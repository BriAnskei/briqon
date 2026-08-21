// activation/composition/activeScheduleService.ts

import { AddActivationService } from "../activation/AddActivationService";
import { ActivationFactory } from "../activation/domain/ActivationFactory";
import { ConflictDetector } from "../activation/domain/conflict/ConflictDetector";
import { ConflictResolver } from "../activation/domain/conflict/ConflictResolver";
import { NonOccuringActivationHandler } from "../activation/domain/conflict/NonOccuringActivationHandler";
import { OccurringActivationHandler } from "../activation/domain/conflict/OccurringActivationHandler";

import { SQLiteActivationRepository } from "../activation/SQLiteActivationRepository";
import { ActiveScheduleDatesRepository } from "../repository/active-schedule-dates.repository";
import { ActiveScheduleRepository } from "../repository/activeSchedule.repo";
import { ActiveScheduleDaysRepository } from "../repository/activeScheduleDays.repo";
import { ScheduleRepository } from "../repository/schedule.repository";
import { ActiveScheduleService } from "../service/activeSchedule.service";

const activeScheduleRepository = new ActiveScheduleRepository();

const activeScheduleDaysRepository = new ActiveScheduleDaysRepository();

const activeScheduleDatesRepository = new ActiveScheduleDatesRepository();

const scheduleRepository = new ScheduleRepository();

const conflictResolver = new ConflictResolver(
  activeScheduleRepository,
  activeScheduleDaysRepository,
);

const activationRepository = new SQLiteActivationRepository(
  activeScheduleRepository,
  scheduleRepository,
  activeScheduleDaysRepository,
  activeScheduleDatesRepository,
);

const occuringActivationHandler = new OccurringActivationHandler(
  activeScheduleRepository,
);

const nonOccuringHandler = new NonOccuringActivationHandler(activeScheduleRepository);

const conflictDetector = new ConflictDetector([
  occuringActivationHandler,
  nonOccuringHandler,
]);

const activationFactory = new ActivationFactory();

const addActivationService = new AddActivationService(
  conflictDetector,
  conflictResolver,
  activationRepository,
  activationFactory,
);

export const activeScheduleService = new ActiveScheduleService(
  addActivationService,
  activeScheduleRepository,
);
