import { requestApi } from "./request";
import type { ApiResult } from "./types";

export async function deleteActivity(
  activityId: number
): Promise<ApiResult<unknown>> {
  return requestApi(`/admin/activities/${activityId}`, {
    method: "DELETE",
  });
}
