import z from 'zod';

export const GeneralChatSchema = z.object({
  intent: z.string(),
  activities: z.array(),
  needsCalculation: z.boolean(),
  answer: z.string(),
});
