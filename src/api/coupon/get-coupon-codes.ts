import { requestApi } from "./request"
import type { AdminCouponCodePageResponse, ApiResult } from "./types"

export interface CouponCodePageQuery {
  page?: number
  size?: number
  sort?: string
  keyword?: string
}

export async function getCouponCodes(
  query: CouponCodePageQuery,
): Promise<ApiResult<AdminCouponCodePageResponse>> {
  const params = new URLSearchParams()

  params.set("page", String(query.page ?? 0))
  params.set("size", String(query.size ?? 50))

  if (query.sort) {
    params.set("sort", query.sort)
  }

  if (query.keyword && query.keyword.trim().length > 0) {
    params.set("keyword", query.keyword.trim())
  }

  return requestApi<AdminCouponCodePageResponse>(`/admin/coupons/code?${params.toString()}`, { method: "GET" })
}
