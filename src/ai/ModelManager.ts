import * as FileSystem from "expo-file-system/legacy";

const MODEL_URL =
  "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf";

/**
 * Legacy API used intentionally because it
 * supports progress callbacks.
 */
const DOCUMENT_DIR = FileSystem.documentDirectory!;

const MODEL_DIR = `${DOCUMENT_DIR}models/`;

const MODEL_PATH = `${MODEL_DIR}Llama-3.2-3B-Instruct-Q4_K_M.gguf`;

export class ModelManager {
  static async ensureModel(
    onProgress?: (percent: number) => void,
  ): Promise<string> {
    const exists = await this.exists();

    if (!exists) {
      return this.download(onProgress);
    }

    return this.getPath();
  }

  static async exists(): Promise<boolean> {
    const info = await FileSystem.getInfoAsync(MODEL_PATH);

    return info.exists;
  }

  static async download(
    onProgress?: (percent: number) => void,
  ): Promise<string> {
    const dirInfo = await FileSystem.getInfoAsync(MODEL_DIR);

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(MODEL_DIR, {
        intermediates: true,
      });
    }

    let download = FileSystem.createDownloadResumable(
      MODEL_URL,
      MODEL_PATH,
      {},
      (progress) => {
        if (progress.totalBytesExpectedToWrite <= 0) {
          return;
        }

        const percent =
          progress.totalBytesWritten / progress.totalBytesExpectedToWrite;

        onProgress?.(percent);
      },
    );

    const maxRetries = 10;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const result = await download.downloadAsync();
        if (result?.uri) {
          return result.uri;
        }
        throw new Error("Download failed: result or uri is missing");
      } catch (e: any) {
        attempt++;
        console.error(`Download attempt ${attempt} failed:`, e.message);

        if (attempt >= maxRetries) {
          throw new Error(
            `Failed to download model after ${maxRetries} attempts: ${e.message}`,
          );
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Try to resume if we have resume data
        try {
          const resumeData = download.savable();
          download = FileSystem.createDownloadResumable(
            MODEL_URL,
            MODEL_PATH,
            {},
            (progress) => {
              if (progress.totalBytesExpectedToWrite <= 0) return;
              onProgress?.(
                progress.totalBytesWritten / progress.totalBytesExpectedToWrite,
              );
            },
            JSON.parse(resumeData).resumeData,
          );
        } catch (resumeError) {
          console.warn(
            "Failed to prepare resume data, restarting download",
            resumeError,
          );
          // If resuming fails, we just continue with the original download object or recreate it
        }
      }
    }

    throw new Error("Failed to download model.");
  }

  static getPath(): string {
    return MODEL_PATH;
  }

  static async delete(): Promise<void> {
    const exists = await this.exists();

    if (!exists) return;

    await FileSystem.deleteAsync(MODEL_PATH);
  }
}
