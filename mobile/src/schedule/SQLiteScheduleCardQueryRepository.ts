import type { ActivationUI, ScheduleCard } from "@/type/ui/schedule/scheduleUI.types";
import type { ActiveScheduleDatesModel } from "../models/active_schedule_dates.model";
import type { ActiveScheduleDaysModel } from "../models/active_schedule_days.model";
import type { ActiveScheduleModel } from "../models/activeSchedule.model";
import type { NonOccuringWindowRangeModel } from "../models/NonOccuringWindowRange.model";
import type { OccuringTimeWindowModel } from "../models/OccuringTimeWindow.model";
import type { ScheduleModel } from "../models/schedule.model";
import type { ActiveScheduleDatesRepository } from "../repository/active-schedule-dates.repository";
import type { ActiveScheduleRepository } from "../repository/activeSchedule.repo";
import type { ActiveScheduleDaysRepository } from "../repository/activeScheduleDays.repo";
import type { NonReccurringRangeRepository } from "../repository/non_reccuring_range.repo";
import type { OccurringTimeWindowRepository } from "../repository/occuring-time-window.repo";
import type { ScheduleRepository } from "../repository/schedule.repository";
import type { ScheduleQueryRepository } from "./ScheduleQueryRepository";

export class SQLiteScheduleCardQueryRepository implements ScheduleQueryRepository {
  constructor(
    private readonly scheduleRepository: ScheduleRepository,
    private readonly activeRepository: ActiveScheduleRepository,
    private readonly activeScheduleDaysRepository: ActiveScheduleDaysRepository,
    private readonly activeScheduleDatesRepository: ActiveScheduleDatesRepository,
    private readonly nonRecurringRangeRepository: NonReccurringRangeRepository,
    private readonly occuringTimeWindowReposity: OccurringTimeWindowRepository,
  ) {}
  private assembleCards(
    schedules: ScheduleModel[],
    activations: ActiveScheduleModel[],
    days: ActiveScheduleDaysModel[],
    dates: ActiveScheduleDatesModel[],
    ranges: NonOccuringWindowRangeModel[],
    timeWindows: OccuringTimeWindowModel[],
  ): ScheduleCard[] {
    return schedules.map((schedule) => {
      const scheduleActivations = activations.filter(
        (activation) => activation.schedule_id === schedule.id,
      );

      const activationUI: ActivationUI[] = scheduleActivations.map((activation) => {
        if (activation.active_type === "date") {
          const activationDate = dates.find(
            (date) => date.active_schedule_id === activation.id,
          );

          if (!activationDate) {
            throw new Error(`Date activation ${activation.id} has no associated date`);
          }

          return {
            activeSchedule: {
              id: activation.id,
              schedule_id: activation.schedule_id,
              active_type: "date",
              recurring: false,
            },
            date: activationDate.date,
          };
        }

        const activationDays = days.filter(
          (day) => day.active_schedule_id === activation.id,
        );

        const selectedDays = activationDays.map((day) => day.weekday);

        if (activation.recurring) {
          const timeWindow = timeWindows.find(
            (window) => window.active_id === activation.id,
          );

          if (!timeWindow) {
            throw new Error(`Recurring activation ${activation.id} has no time window`);
          }

          return {
            activeSchedule: {
              id: activation.id,
              schedule_id: activation.schedule_id,
              active_type: "days",
              recurring: true,
            },
            days: selectedDays,
            timeWindow,
          };
        }

        const activationRanges = ranges.filter(
          (range) => range.activeId === activation.id,
        );

        return {
          activeSchedule: {
            id: activation.id,
            schedule_id: activation.schedule_id,
            active_type: "days",
            recurring: false,
          },
          days: selectedDays,
          ranges: activationRanges,
        };
      });

      return {
        schedule,
        activations: activationUI,
        isActive: activationUI.length > 0,
      };
    });
  }
  async fetchCards(): Promise<ScheduleCard[]> {
    return this.scheduleRepository.transaction(async (db) => {
      const [schedules, activations, days, dates, ranges, timeWindows] =
        await Promise.all([
          this.scheduleRepository.findAll(db),
          this.activeRepository.findAll(db),
          this.activeScheduleDaysRepository.findAll(db),
          this.activeScheduleDatesRepository.findAll(db),
          this.nonRecurringRangeRepository.findAll(db),
          this.occuringTimeWindowReposity.findAll(db),
        ]);

      return this.assembleCards(schedules, activations, days, dates, ranges, timeWindows);
    });
  }
}
