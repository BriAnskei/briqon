import { z } from "zod";

export const CurrentActiveSchema = z.object({
  id: z.string(),
  active_id: z.string(),
  on_active: z.boolean(),
});

export type CurrentActive = z.infer<typeof CurrentActiveSchema>;
