import { API_URL } from "../api.client";

export class AiService {
  static streamAi(
    prompt: string,
    onChunk: (chunk: string) => void,
    onMode: (mode: number) => void, // 0 = general chat, 1 = generate schedule
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}/ai`, true);
      xhr.setRequestHeader("Content-Type", "application/json");

      let lastIndex = 0;

      const modes = ["MODE 1", "MODE 2"];
      let mode = "";
      let hasBodcastedMode = false;

      xhr.onprogress = () => {
        const newText = xhr.responseText.slice(lastIndex);
        lastIndex = xhr.responseText.length;

        const lines = newText.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const chunk = line.slice(6);

            if (mode.length < 7) {
              mode += chunk;

              // Check if mode just became complete
              mode.includes("MODE 1") ? onMode(0) : onMode(1);
            } else {
              if (chunk) onChunk(chunk);
            }
          }
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Request failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error"));
      xhr.ontimeout = () => reject(new Error("Request timed out"));

      xhr.send(JSON.stringify({ prompt }));
    });
  }
}
