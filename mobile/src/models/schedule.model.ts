import z from "zod";

// 24 hrs time format
const TimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format");

const ScheduleItemSchema = z.object({
  start_time: TimeSchema,
  end_time: TimeSchema,
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

// schedule generation type
export const CreateScheduleItemArraySchema = ScheduleItemSchema.omit({
  enabled: true,
}).array();

export type SchedulItemArr = z.infer<typeof CreateScheduleItemArraySchema>;
