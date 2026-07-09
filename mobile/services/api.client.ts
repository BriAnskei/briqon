export const API_URL = process.env.EXPO_PUBLIC_SERVER_URL;

export async function apiFetch(path: string, option?: RequestInit) {
  console.log("url: ", API_URL);
  const res = await fetch(`${API_URL}${path}`, {
    ...option,
    headers: {
      "Content-Type": "application/json",
      ...(option?.headers || {}),
    },
  });

  return res;
}
