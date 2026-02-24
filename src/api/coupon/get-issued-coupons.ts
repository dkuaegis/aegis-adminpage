import { requestApi } from "./request";
import type { AdminIssuedCouponPageResponse, ApiResult } from "./types";

export interface IssuedCouponPageQuery {
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
  couponId?: number;
  memberId?: number;
  isValid?: boolean;
}

export async function getIssuedCoupons(
  query: IssuedCouponPageQuery
): Promise<ApiResult<AdminIssuedCouponPageResponse>> {
  const params = new URLSearchParams();

  params.set("page", String(query.page ?? 0));
  params.set("size", String(query.size ?? 50));

  if (query.sort) {
    params.set("sort", query.sort);
  }

  if (query.keyword && query.keyword.trim().length > 0) {
    params.set("keyword", query.keyword.trim());
  }

  if (query.couponId !== undefined) {
    params.set("couponId", String(query.couponId));
  }

  if (query.memberId !== undefined) {
    params.set("memberId", String(query.memberId));
  }

  if (query.isValid !== undefined) {
    params.set("isValid", String(query.isValid));
  }

  return requestApi<AdminIssuedCouponPageResponse>(
    `/admin/coupons/issued?${params.toString()}`,
    {
      method: "GET",
    }
  );
}
