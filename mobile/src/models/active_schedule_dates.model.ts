import z from "zod";

export const ActiveSheduleDatesSchema = z.object({
	id: z.string(),
	active_schedule_id: z.string(),
	date: z.date(),
});

export type ActiveScheduleDates = z.infer<typeof ActiveSheduleDatesSchema>;

export const CreateActiveScheduleDatesSchema = ActiveSheduleDatesSchema.omit({
	id: true,
});

export type CreateActiveScheduleDates = z.infer<
	typeof CreateActiveScheduleDatesSchema
>;
