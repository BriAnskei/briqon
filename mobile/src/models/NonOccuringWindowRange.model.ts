import { z } from "zod";

export const NonOccuringWindowRangeSchema = z.object({
  id: z.string(),
  activeId: z.string(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});
export const CreateNonOccuringWindowRangeSchema = NonOccuringWindowRangeSchema.omit({
  id: true,
});

export type NonOccuringWindowRangeModel = z.infer<typeof NonOccuringWindowRangeSchema>;

export type CreateNonOccuringWindowRange = z.infer<
  typeof CreateNonOccuringWindowRangeSchema
>;
