import { requestApi } from './request';
import type { AdminIssuedCoupon, ApiResult } from './types';

export async function createIssuedCoupons(couponId: number, memberIds: number[]): Promise<ApiResult<AdminIssuedCoupon[]>> {
  return requestApi<AdminIssuedCoupon[]>('/admin/coupons/issued', {
    method: 'POST',
    body: JSON.stringify({ couponId, memberIds }),
  });
}
