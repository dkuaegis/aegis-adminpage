import { requestApi } from "./request";
import type { AdminMember, ApiResult } from "./types";

export async function Members(): Promise<ApiResult<AdminMember>> {
  return requestApi<AdminMember>("/members", {
    method: "GET",
  });
}
