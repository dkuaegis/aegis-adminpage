import type { ApiResult, RequestApiOptions } from "@/lib/http/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function resolveJsonHeaders(headers?: HeadersInit): Headers {
  const merged = new Headers(headers);

  if (!merged.has("accept")) {
    merged.set("accept", "application/json");
  }

  if (!merged.has("Content-Type")) {
    merged.set("Content-Type", "application/json");
  }

  return merged;
}

export async function requestApi<T>(
  path: string,
  init?: RequestInit,
  options?: RequestApiOptions
): Promise<ApiResult<T>> {
  const logContext = options?.logContext ?? "Admin API Error";

  if (!API_BASE_URL) {
    console.error(`[${logContext}] Missing VITE_API_BASE_URL`);
    return { ok: false, status: 0 };
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: resolveJsonHeaders(init?.headers),
    });

    const contentType = response.headers.get("content-type") || "";
    const canParseJson = contentType.includes("application/json");

    if (response.ok) {
      if (response.status === 204 || !canParseJson) {
        return { ok: true, status: response.status };
      }

      const data = (await response.json()) as T;
      return { ok: true, status: response.status, data };
    }

    if (!canParseJson) {
      return { ok: false, status: response.status };
    }

    const error = (await response.json()) as { name?: string };
    return { ok: false, status: response.status, errorName: error.name };
  } catch (error) {
    console.error(`[${logContext}]`, error);
    return { ok: false, status: 0 };
  }
}
