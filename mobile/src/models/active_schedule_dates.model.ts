import z from "zod";

export const ActiveSheduleDatesSchema = z.object({
  id: z.string(),
  active_schedule_id: z.string(),
  date: z.date(),
});

export const CreateActiveScheduleDatesSchema = ActiveSheduleDatesSchema.omit({
  id: true,
});

export type CreateActiveScheduleDates = z.infer<typeof CreateActiveScheduleDatesSchema>;

export type ActiveScheduleDatesModel = z.infer<typeof ActiveSheduleDatesSchema>;
