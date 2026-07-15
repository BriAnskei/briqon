import { ulid } from "ulid";
import { z } from "zod";
import {
  ScheduleItem,
  ScheduleItemSchema,
} from "@/src/models/schedule.model";
import {
  ScheduleSummary,
  ScheduleSummarySchema,
} from "@/src/models/schedule_summary.model";
import { SubSummary, SubSummarySchema } from "@/src/models/sub_summary.model";

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

const RawScheduleResponseSchema = z.object({
  summary: z.object({ categories: RawCategorySchema.array() }),
  schedule: RawScheduleItemSchema.array(),
});

// ── Client-model result (relational shape for UI / SQLite) ─────────────────
export type GenerationResult = {
  summary: ScheduleSummary[];
  subSummary: SubSummary[];
  schedule: ScheduleItem[];
};

/**
 * Validate the raw API response and separate it into the client models
 * (ScheduleSummary, SubSummary, ScheduleItem). Throws a ZodError if the
 * response does not match the server schema or any of the client models.
 */
export function parseScheduleResponse(raw: unknown): GenerationResult {
  const parsed = RawScheduleResponseSchema.parse(raw);

  const scheduleId = ulid();
  const summary: ScheduleSummary[] = [];
  const subSummary: SubSummary[] = [];





















  

  parsed.summary.categories.forEach((category) => {
    const summaryId = ulid();
    summary.push(
      ScheduleSummarySchema.parse({
        id: summaryId,
        schedule_id: scheduleId,
        name: category.name,
        total: category.total,
      }),
    );

    category.sub_activity?.forEach((sub) => {
      subSummary.push(
        SubSummarySchema.parse({
          id: ulid(),
          summary_id: summaryId,
          name: sub.name,
          total: sub.total,
        }),
      );
    });
  });

  const schedule: ScheduleItem[] = parsed.schedule.map((item) =>
    ScheduleItemSchema.parse(item),
  );

  return { summary, subSummary, schedule };
}
