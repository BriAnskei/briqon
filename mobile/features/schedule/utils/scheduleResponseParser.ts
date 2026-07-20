import { ScheduleItemSchema } from "@/src/models/schedule.model";
import { RawScheduleResponseSchema } from "@/src/models/scheduleApiResponse.model";
import {
  SubSummariesSchema,
  SubSummary,
} from "@/src/models/sub_summaries.model";
import { ScheduleSummary, SummariesSchema } from "@/src/models/summaries.model";
import { ScheduleItem } from "@/type/MessageTypes";
import { ulid } from "ulid";

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

  const summary: ScheduleSummary[] = [];
  const subSummary: SubSummary[] = [];

  parsed.summary.categories.forEach((category) => {
    const summaryId = ulid();
    summary.push(
      SummariesSchema.parse({
        id: summaryId,
        schedule_id: '2',
        name: category.name,
        total: category.total,
      }),
    );

    category.sub_activity?.forEach((sub) => {
      subSummary.push(
        SubSummariesSchema.parse({
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
