import { requestApi } from "./request";
import type { AdminCouponPageResponse, ApiResult } from "./types";

export interface CouponPageQuery {
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
}

export async function getCoupons(
  query: CouponPageQuery
): Promise<ApiResult<AdminCouponPageResponse>> {
  const params = new URLSearchParams();

  params.set("page", String(query.page ?? 0));
  params.set("size", String(query.size ?? 50));

  if (query.sort) {
    params.set("sort", query.sort);
  }

  if (query.keyword && query.keyword.trim().length > 0) {
    params.set("keyword", query.keyword.trim());
  }

  return requestApi<AdminCouponPageResponse>(
    `/admin/coupons?${params.toString()}`,
    { method: "GET" }
  );
}
