import z from "zod";

export function validate<T>(schema: z.ZodSchema<T>, input: unknown): T {
  return schema.parse(input);
}
