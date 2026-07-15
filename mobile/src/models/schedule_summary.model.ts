import z from "zod";

export const ScheduleSummarySchema = z.object({
  id: z.string(),
  schedule_id: z.string(),
  name: z.string(),
  total: z.string(),
});

export const CreateScheduleSummarySchema = ScheduleSummarySchema.omit({
  id: true,
});

export type ScheduleSummary = z.infer<typeof ScheduleSummarySchema>;

export type CreateScheduleSummary = z.infer<typeof CreateScheduleSummarySchema>;
