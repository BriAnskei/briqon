import { ActiveScheduleDatesRepository } from "../repository/active-schedule-dates.repository";
import { ActiveScheduleRepository } from "../repository/activeSchedule.repo";
import { ActiveScheduleDaysRepository } from "../repository/activeScheduleDays.repo";
import { NonReccurringRangeRepository } from "../repository/non_reccuring_range.repo";
import { OccurringTimeWindowRepository } from "../repository/occuring-time-window.repo";
import { ScheduleRepository } from "../repository/schedule.repository";
import { ScheduleCardQuery } from "../schedule/ScheduleCardQuery";
import { SQLiteScheduleCardQueryRepository } from "../schedule/SQLiteScheduleCardQueryRepository";

export const scheduleQuery = new ScheduleCardQuery(
  new SQLiteScheduleCardQueryRepository(
    new ScheduleRepository(),
    new ActiveScheduleRepository(),
    new ActiveScheduleDaysRepository(),
    new ActiveScheduleDatesRepository(),
    new NonReccurringRangeRepository(),
    new OccurringTimeWindowRepository(),
  ),
);

