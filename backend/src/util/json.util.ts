export function extractJson(text: string): string {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  return text.trim();
}

export function safeParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Invalid Json format');
  }
}
