import { requestApi } from "./request"
import type { AdminActivityPageResponse, ApiResult } from "./types"

export interface ActivityPageQuery {
  page?: number
  size?: number
  sort?: string
  keyword?: string
}

export async function GetActivities(
  query: ActivityPageQuery,
): Promise<ApiResult<AdminActivityPageResponse>> {
  const params = new URLSearchParams()

  params.set("page", String(query.page ?? 0))
  params.set("size", String(query.size ?? 50))

  if (query.sort) {
    params.set("sort", query.sort)
  }

  if (query.keyword && query.keyword.trim().length > 0) {
    params.set("keyword", query.keyword.trim())
  }

  return requestApi<AdminActivityPageResponse>(`/admin/activities?${params.toString()}`, {
    method: "GET",
  })
}
