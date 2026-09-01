import { z } from "zod";

export const OccuringTimeWindowSchema = z.object({
  id: z.string(), // ULID
  active_id: z.string(),
  window_start_min: z.number().int(),
  window_end_min: z.number().int(),
});

export const CreateOccuringTimeWindowSchema = OccuringTimeWindowSchema.omit({
  id: true,
});

export type OccuringTimeWindow = z.infer<typeof OccuringTimeWindowSchema>;

export type CreateOccuringTimeWindow = z.infer<typeof CreateOccuringTimeWindowSchema>;
