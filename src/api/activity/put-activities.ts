import { requestApi } from "./request";
import type { ApiResult } from "./types";

export interface ActivityInfo {
  activityId: number;
  name: string;
  pointAmount: number;
}

// 조회
export async function getActivityById(
  activityId: number
): Promise<ApiResult<ActivityInfo>> {
  return requestApi<ActivityInfo>(`/admin/activities/${activityId}`, {
    method: "GET",
  });
}

// 수정
export async function updateActivity(
  activityId: number,
  name: string,
  pointAmount: number
): Promise<ApiResult<unknown>> {
  const requestBody = {
    name,
    pointAmount,
  };

  return requestApi(`/admin/activities/${activityId}`, {
    method: "PUT",
    body: JSON.stringify(requestBody),
  });
}
