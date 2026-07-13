import {
  CreateScheduleResponseSchema,
  GeminiScheduleSchema,
} from "../schema/Schedule.schema";
import { ai } from "./ai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  const { prompt, systemInstruction } = req.body;

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

      console.error(parsed.error);
      MAX_ATTEMPS--;
    }

    return res.status(500).json({
      success: false,
      error: "Failed request",
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
