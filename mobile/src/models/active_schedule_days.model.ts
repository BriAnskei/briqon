import z from "zod";

// actual schema
export const ActiveScheduleDaysSchema = z.object({
	id: z.string(),
	active_schedule_id: z.string(),
	weekday: z.number(),
});

export type ActiveScheduleDays = z.infer<typeof ActiveScheduleDaysSchema>;

// insertion schema
export const CreateActiveScheduleDaysSchema = ActiveScheduleDaysSchema.omit({
	id: true,
});

export type CreateActiveScheduleDays = z.infer<
	typeof CreateActiveScheduleDaysSchema
>;
