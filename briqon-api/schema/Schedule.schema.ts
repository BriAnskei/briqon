import z, { string } from "zod";

const TimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:mm format");

const scheduleItemSchema = z.object({
  start_time: TimeSchema,
  end_time: TimeSchema,
  activity: z.string(),
});

export const CreateScheduleResponseSchema = z.object({
  summary: z.string(),
  schedule: scheduleItemSchema.array(),
});
