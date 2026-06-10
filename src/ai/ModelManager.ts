import * as FileSystem from "expo-file-system/legacy";

const MODEL_URL = "https://your-cdn.com/model.gguf";

/**
 * Legacy API used intentionally because it
 * supports progress callbacks.
 */
const DOCUMENT_DIR = FileSystem.documentDirectory!;

const MODEL_DIR = `${DOCUMENT_DIR}models/`;

// const MODEL_PATH = `${MODEL_DIR}Llama-3.2-1B-Instruct-UD-Q5_K_XL.gguf`;

const MODEL_PATH = `${MODEL_DIR}qwen2.5-3b-instruct-q2_k.gguf`;

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

    const download = FileSystem.createDownloadResumable(
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

    const result = await download.downloadAsync();

    if (!result?.uri) {
      throw new Error("Failed to download model.");
    }

    return result.uri;
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
