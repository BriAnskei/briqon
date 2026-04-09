export const API_URL = process.env.MY_SERVER_URL;
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
