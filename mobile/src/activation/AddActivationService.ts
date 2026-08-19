import type { CreateActivationInput } from "@/type/ui/schedule/activation.types";
import {
  formatDateLong,
  formatMinutes,
  formatTime,
  minutesToTime,
} from "@/utils/TimeFormatter";
import type { ActivationRepository } from "./ActivationRepository";
import type { ActivationFactory } from "./domain/ActivationFactory";
import type { ConflictDetector } from "./domain/conflict/ConflictDetector";
import type { ConflictResolver } from "./domain/conflict/ConflictResolver";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export class AddActivationService {
  constructor(
    private readonly conflictDetector: ConflictDetector,
    private readonly conflictResolver: ConflictResolver,
    private readonly activationRepository: ActivationRepository,
    private readonly activationFactory: ActivationFactory,
  ) {}

  async add(input: CreateActivationInput) {
    const context = this.activationFactory.create(input);

    const { activeType, recurring } = input;

    if (activeType === "days" && recurring) {
      const { days, occuringOverflow } = context.getDayTypeOccuring();
      console.log(
        "🔹 [Activation Debug] DayTypeOccuring\n" +
          `  • days: ${JSON.stringify(
            days.map((d) => ({
              id: d.id,
              activeId: d.activeId,
              weekday: `${d.weekday} (${WEEKDAY_NAMES[d.weekday]})`,
            })),
            null,
            2,
          )}\n` +
          `  • occuringOverflow: ${JSON.stringify(
            {
              id: occuringOverflow.id,
              activeId: occuringOverflow.activeId,
              startDayMinutes: `${occuringOverflow.windowStartMin} (${minutesToTime(occuringOverflow.windowStartMin)})`,
              endDayMinutes: `${occuringOverflow.windowEndMin} (${minutesToTime(occuringOverflow.windowEndMin)})`,
            },
            null,
            2,
          )}`,
      );
    } else if (activeType === "days" && !recurring) {
      const { days, ranges } = context.getDayTypeNonOccuring();
      console.log(
        "🔸 [Activation Debug] DayTypeNonOccuring\n" +
          `  • days: ${JSON.stringify(
            days.map((d) => ({
              id: d.id,
              activeId: d.activeId,
              weekday: `${d.weekday} (${WEEKDAY_NAMES[d.weekday]})`,
            })),
            null,
            2,
          )}\n` +
          `  • ranges: ${JSON.stringify(
            ranges.map((r) => ({
              id: r.id,
              activeId: r.activeId,
              startsAt: `${r.startsAt.toISOString()} | ${formatDateLong(r.startsAt)} ${formatTime(r.startsAt)}`,
              endsAt: `${r.endsAt.toISOString()} | ${formatDateLong(r.endsAt)} ${formatTime(r.endsAt)}`,
            })),
            null,
            2,
          )}`,
      );
    } else if (activeType === "date") {
      const { date, range } = context.getDateType();
      console.log(
        "🔷 [Activation Debug] DateType\n" +
          `  • date: ${JSON.stringify(
            {
              id: date.id,
              activeId: date.activeId,
              date: `${date.date.toISOString()} | ${formatDateLong(date.date)}`,
            },
            null,
            2,
          )}\n` +
          `  • range: ${JSON.stringify(
            {
              id: range.id,
              activeId: range.activeId,
              startsAt: `${range.startsAt.toISOString()} | ${formatDateLong(range.startsAt)} ${formatTime(range.startsAt)}`,
              endsAt: `${range.endsAt.toISOString()} | ${formatDateLong(range.endsAt)} ${formatTime(range.endsAt)}`,
            },
            null,
            2,
          )}`,
      );
    }

    const conflicts = await this.conflictDetector.detect(context);
    //
    // if (!context.overwrite && conflicts.length > 0) {
    //   throw new ScheduleConflictError(
    //     `The activation contains ${conflicts.length} conflicts`,
    //     conflicts,
    //   );
    // }
    //
    // if (context.overwrite) {
    //   await this.conflictResolver.resolve(conflicts, context.payload.selectedDays ?? []);
    // }
    //
    // await this.activationRepository.create(context.payload);
  }
}
