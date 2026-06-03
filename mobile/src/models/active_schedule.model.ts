import { z } from "zod";

export const ActiveScheduleSchema = z.object({
  id: z.string(), // ULID
  schedule_id: z.string(),
  active_type: z.enum(["days", "date"]),
  recurring: z.boolean(),
  starts_at: z.date().optional(),
  ends_at: z.date().optional(),
});

export const CreateActivecheduleSchema = ActiveScheduleSchema.omit({
  id: true,
  schedule_id: true,
});

export const CreateActiveScheduleEntitySchema = ActiveScheduleSchema.omit({
  id: true,
});

export type ActiveSchedule = z.infer<typeof ActiveScheduleSchema>;

export type CreateActiveSchedule = z.infer<typeof CreateActivecheduleSchema>;

export type CreateActiveScheduleEntity = z.infer<
  typeof CreateActiveScheduleEntitySchema
>;
