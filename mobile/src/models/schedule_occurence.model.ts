import { z } from "zod";

export const ScheduleOccurrenceSchema = z.object({
  id: z.string(),
  active_id: z.string(),
  window_start: z.iso.datetime(),
  window_ends: z.iso.datetime(),
});

export type ScheduleOccurrence = z.infer<typeof ScheduleOccurrenceSchema>;
