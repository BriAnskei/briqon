import { z } from 'zod';

export const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // 24-hour format (HH:MM).

export const ScheduleItemSchema = z
  .object({
    start_time: z.string().regex(timeRegex, 'Invalid start time format'),
    end_time: z.string().regex(timeRegex, 'Invalid end time format'),
    activity: z.string().min(1, 'Activity cannot be empty'),
  })
  .refine((d) => d.end_time > d.start_time, {
    message: 'end_time must be after start_time',
    path: ['end_time'],
  });

export const ScheduleSchema = z.array(ScheduleItemSchema);
export type ScheduleItem = z.infer<typeof ScheduleItemSchema>;
