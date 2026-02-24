import { requestApi as requestApiClient } from "@/lib/http/client";
import type { ApiResult } from "./types";

export function requestApi<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  return requestApiClient<T>(path, init, { logContext: "Payment API Error" });
}
