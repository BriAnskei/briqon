import { z } from "zod";

export const ActiveScheduleSchema = z.object({
  id: z.string(), // ULID
  schedule_id: z.string(),
  specific_date: z.date().optional(),
  selected_days: z.array(z.number()),
  repeat_weekly: z.boolean(),
  starts_at: z.date().optional(),
  ends_at: z.date().optional(),
});

export const CreateActivecheduleSchema = ActiveScheduleSchema.omit({
  id: true,
});

export type ActiveSchedule = z.infer<typeof ActiveScheduleSchema>;

export type CreateActiveSchedule = z.infer<typeof CreateActivecheduleSchema>;
