import { CreateScheduleResponseSchema } from "../schema/Schedule.schema";
import { ai } from "./ai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const { prompt, systemInstruction } = req.body;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",

      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: CreateScheduleResponseSchema,
      },
      contents: prompt,
    });

    return res.status(200).json({
      success: true,
      res: response.text,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
