import z from "zod";

export const OccuringOverFlowSchema = z.object({
  id: z.string(),
  active_id: z.string(),
  minutes_exceeded: z.number(),
});

export type OccurringOverFlow = z.infer<typeof OccuringOverFlowSchema>;
