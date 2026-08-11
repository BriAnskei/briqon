import { z } from "zod";

export const NonRecurringRangesSchema = z.object({
  id: z.string(),
  active_id: z.string(),
  starts_at: z.iso.datetime(),
  ends_at: z.iso.datetime(),
});

export type NonRecurringRanges = z.infer<typeof NonRecurringRangesSchema>;
