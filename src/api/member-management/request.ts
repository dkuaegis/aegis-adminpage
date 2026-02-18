import type { ApiResult } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function requestApi<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const initHeaders = init?.headers ?? {};
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        ...initHeaders,
      },
    });

    const contentType = response.headers.get('content-type') || '';
    const canParseJson = contentType.includes('application/json');

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
    console.error('[Member Management API Error]', error);
    return { ok: false, status: 0 };
  }
}
