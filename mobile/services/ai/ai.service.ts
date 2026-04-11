import { ScheduleItem } from "@/type/MessageTypes";
import { API_URL, apiFetch } from "../api.client";

export class AiService {
  static generateGeneralMessageStream(
    prompt: string,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}/ai/stream`, true);
      xhr.setRequestHeader("Content-Type", "application/json");

      let lastIndex = 0;
      let response = "";

      xhr.onprogress = () => {
        const newText = xhr.responseText.slice(lastIndex);
        lastIndex = xhr.responseText.length;

        const lines = newText.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const chunk = line.slice(6);
            const normalizedChunk = chunk.replace(/\\n/g, "\n"); // unescape \\n → real \n
            onChunk(normalizedChunk);
          }
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
          console.log("model response: ", response);
        } else {
          reject(new Error(`Request failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error"));
      xhr.ontimeout = () => reject(new Error("Request timed out"));

      xhr.send(JSON.stringify({ prompt }));
    });
  }

  static async generateScheduleJson(prompt: string): Promise<ScheduleItem[]> {
    try {
      console.log("generetd promp: ", prompt);
      const res = await apiFetch("/ai/schedule", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate schedule");
      }

      const scheduleJson = await res.json();

      return scheduleJson;
    } catch (error) {
      console.error(error);

      throw error;
    }
  }
}
