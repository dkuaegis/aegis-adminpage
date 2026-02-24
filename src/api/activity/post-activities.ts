import { requestApi } from "./request";
import type { ApiResult } from "./types";

export interface CreateActivityRequest {
  name: string;
  pointAmount: number;
}

export async function createActivity(
  name: string,
  pointAmount: number
): Promise<ApiResult<unknown>> {
  const requestBody: CreateActivityRequest = {
    name,
    pointAmount,
  };

  return requestApi("/admin/activities", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
}
