import z from "zod";

const ScheduleItemSchema = z.object({
  start_time: z.string(),
  end_time: z.string(),
  activity: z.string(),
  enabled: z.boolean().optional(),
});

export const ScheduleSchema = z.object({
  id: z.string(), // ULID
  name: z.string(),
  schedule_list: z.array(ScheduleItemSchema),
  temporary: z.boolean(),
});

export const CreateScheduleSchema = ScheduleSchema.omit({
  id: true,
});

export type Schedule = z.infer<typeof ScheduleSchema>;

export type CreateSchedule = z.infer<typeof CreateScheduleSchema>;
