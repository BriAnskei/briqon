import {
  CreateScheduleResponseSchema,
  GeminiScheduleSchema,
} from "../schema/Schedule.schema";
import { ai } from "../util/ai";
import { withAuth } from "./middleware/auth";
import { withRateLimit } from "./middleware/rateLimit";

export async function generateHanlder(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  const { prompt, systemInstruction } = req.body;

  if (!prompt || !systemInstruction) {
    return res.status(400).json({
      success: false,
      error: "Missing fields",
    });
  }

  try {
    let MAX_ATTEMPS = 2;

    while (MAX_ATTEMPS > 0) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",

        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: GeminiScheduleSchema,
        },

        contents: prompt,
      });

      const parsed = CreateScheduleResponseSchema.safeParse(
        JSON.parse(response.text as string),
      );
      if (parsed.success) {
        return res.status(200).json({
          success: true,
          res: parsed.data,
        });
      }

      console.log("invalid scheama, retriying");
      MAX_ATTEMPS--;
    }

    return res.status(500).json({
      success: false,
      error: "Failed request",
    });
  } catch (err: unknown) {
    console.error(err);

    const aiError = getGeminiError(err);

    return res.status(500).json({
      success: false,
      error: aiError,
    });
  }
}

function getGeminiError(error: unknown) {
  if (!(error instanceof Error)) {
    return {
      code: "UNKNOWN_ERROR",
      message: "An unexpected error occurred.",
    };
  }

  try {
    const parsed = JSON.parse(error.message);

    if (parsed?.error) {
      return {
        code: parsed.error.status ?? "AI_ERROR",
        message: parsed.error.message ?? "AI generation failed.",
      };
    }
  } catch {
    // error.message wasn't JSON
  }

  return {
    code: "AI_ERROR",
    message: error.message,
  };
}
export default withAuth(withRateLimit(generateHanlder));
