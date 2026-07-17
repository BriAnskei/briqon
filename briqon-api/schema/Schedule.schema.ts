import * as z from "zod";

const TimeSchema = z
	.string()
	.regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:mm format");

const scheduleItemSchema = z.object({
	start_time: TimeSchema,
	end_time: TimeSchema,
	activity: z.string(),
});

const summarySubActivitySchedume = z.object({
	name: z.string(),
	total: z.string(),
});

const summaryCategorySchema = z.object({
	name: z.string(),
	total: z.string(),
	sub_activity: summarySubActivitySchedume.array().optional(),
});

const summarySchema = z.object({
	categories: summaryCategorySchema.array(),
});

export const CreateScheduleResponseSchema = z.object({
	summary: summarySchema,
	schedule: scheduleItemSchema.array(),
});

export const GeminiScheduleSchema = CreateScheduleResponseSchema.toJSONSchema();
