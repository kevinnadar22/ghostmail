import { APIResponse } from "@/schemas/api-response";

export async function apiClient<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  // Use a default base URL if needed, or relative path
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  let json: APIResponse<T>;
  try {
    json = await res.json();
  } catch (error) {
    throw new Error("Failed to parse JSON response");
  }

  if (!json.success) {
    // Prefer the error message from the API, fallback to status text
    throw new Error(json.error || json.message || `Request failed with status ${res.status}`);
  }

  return json.data as T;
}
