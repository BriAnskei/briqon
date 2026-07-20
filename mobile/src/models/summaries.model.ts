import z from "zod";

export const SummariesSchema = z.object({
	id: z.string(),
	schedule_id: z.string(),
	name: z.string(),
	total: z.string(),
});

export const CreateSummariesSchema = SummariesSchema.omit({
	id: true,
});

export type ScheduleSummary = z.infer<typeof SummariesSchema>;

export type CreateScheduleSummary = z.infer<typeof CreateSummariesSchema>;
