import z from 'zod';

export const GeneralChatSchema = z.object({
  intent: z.enum(['duration_query', 'general_question']),
  activities: z.array(z.string()),
  needsCalculation: z.boolean(),
  answer: z.string().nullable(),
});
