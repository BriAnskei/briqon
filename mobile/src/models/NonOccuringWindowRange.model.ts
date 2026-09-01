import { z } from "zod";

export const NonOccuringWindowRangeSchema = z.object({
  id: z.string(), // ULID
  active_id: z.string(),
  starts_at: z.date(),
  ends_at: z.date(),
});

export const CreateNonOccuringWindowRangeSchema = NonOccuringWindowRangeSchema.omit({
  id: true,
});

export type NonOccuringWindowRange = z.infer<typeof NonOccuringWindowRangeSchema>;

export type CreateNonOccuringWindowRange = z.infer<
  typeof CreateNonOccuringWindowRangeSchema
>;
