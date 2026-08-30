import { AddActivationService } from "../activation/AddActivationService";
import { ActivationFactory } from "../activation/domain/ActivationFactory";
import { ConflictDetector } from "../activation/domain/conflict/ConflictDetector";
import { ConflictResolver } from "../activation/domain/conflict/ConflictResolver";
import { NonReccuringActivationHandler } from "../activation/domain/conflict/NonReccuringActivationHandler";
import { NonRecurringAgainstRecurringHandler } from "../activation/domain/conflict/NonRecurringAgainstRecurringHandler";
import { ReccuringActivationHandler } from "../activation/domain/conflict/ReccuringActivationHandler";
import { RecurringAgainstNonRecurringHandler } from "../activation/domain/conflict/RecurringAgainstNonRecurringHandler";
import { SQLiteActivationRepository } from "../activation/SQLiteActivationRepository";
import { ActiveScheduleDatesRepository } from "../repository/active-schedule-dates.repository";
import { ActiveScheduleRepository } from "../repository/activeSchedule.repo";
import { ActiveScheduleDaysRepository } from "../repository/activeScheduleDays.repo";
import { NonReccurringRangeRepository } from "../repository/non_reccuring_range.repo";
import { OccurringTimeWindowRepository } from "../repository/occuring-time-window.repo";
import { scheduleService } from "./scheduleServiceComposition";

const activeScheduleRepository = new ActiveScheduleRepository();

const activeScheduleDaysRepository = new ActiveScheduleDaysRepository();

const activeScheduleDatesRepository = new ActiveScheduleDatesRepository();

const conflictResolver = new ConflictResolver(
  activeScheduleRepository,
  activeScheduleDaysRepository,
);

const occuringTimeWindowRepository = new OccurringTimeWindowRepository();

const nonReccuringRangeRepository = new NonReccurringRangeRepository();

const activationRepository = new SQLiteActivationRepository(
  activeScheduleRepository,
  activeScheduleDaysRepository,
  activeScheduleDatesRepository,
  occuringTimeWindowRepository,
  nonReccuringRangeRepository,
);

const occuringActivationHandler = new ReccuringActivationHandler(
  activeScheduleRepository,
);

const nonOccuringHandler = new NonReccuringActivationHandler(activeScheduleRepository);

const reccuringAgaintsNonreccuring = new RecurringAgainstNonRecurringHandler(
  activeScheduleRepository,
);

const nonRecurringAgaintsRecurringHandler = new NonRecurringAgainstRecurringHandler(
  activeScheduleRepository,
);

const conflictDetector = new ConflictDetector([
  occuringActivationHandler,
  nonOccuringHandler,
  reccuringAgaintsNonreccuring,
  nonRecurringAgaintsRecurringHandler,
]);

const activationFactory = new ActivationFactory();

export const addActivationService = new AddActivationService(
  conflictDetector,
  conflictResolver,
  activationFactory,
  activationRepository,
  scheduleService,
);
