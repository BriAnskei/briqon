import z from "zod";
// ── Raw API response (mirrors the briqon-api serverless response) ──────────
const TimeSchema = z
	.string()
	.regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format");

const RawScheduleItemSchema = z.object({
	start_time: TimeSchema,
	end_time: TimeSchema,
	activity: z.string(),
});

const RawSubActivitySchema = z.object({
	name: z.string(),
	total: z.string(),
});

const RawCategorySchema = z.object({
	name: z.string(),
	total: z.string(),
	sub_activity: RawSubActivitySchema.array().optional(),
});

export const RawScheduleResponseSchema = z.object({
	summary: z.object({ categories: RawCategorySchema.array() }),
	schedule: RawScheduleItemSchema.array(),
});
