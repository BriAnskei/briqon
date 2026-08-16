export type CreateActivationInput = {
  scheduleId: string;

  activeType: "days" | "date";

  recurring: boolean;

  selectedDays?: number[];

  selectedDate?: Date;

  overwrite: boolean;

  nonReccuringDaysTypeStartsAt?: Date;

  scheduleTimeStart: string;
  // both HH:MM format
  sheduleTimeEnd: string;
};
