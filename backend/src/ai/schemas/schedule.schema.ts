import { z } from 'zod';

export const ScheduleItemSchema = z.object({
  start_time: z.string(),
  end_time: z.string(),
  activity: z.string(),
});

export const ScheduleSchema = z.array(ScheduleItemSchema);
