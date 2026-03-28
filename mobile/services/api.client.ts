export const API_URL = "http://192.168.1.5:3000";

export async function apiFetch(path: string, option?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...option,
    headers: {
      "Content-Type": "application/json",
      ...(option?.headers || {}),
    },
  });

  return res;
}
