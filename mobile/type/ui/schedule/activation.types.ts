export type CreateActivationInput = {
  scheduleId: string;

  activeType: "days" | "date";

  recurring: boolean;

  selectedDays?: number[];

  selectedDate?: string;

  overwrite: boolean;

  nonReccuringDaysTypeStartsAt?: Date;

  scheduleTimeStart: string;

  sheduleTimeEnd: string;
};
