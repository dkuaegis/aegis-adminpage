import { requestApi } from './request';
import type { AdminCoupon, ApiResult } from './types';

export async function updateCouponName(couponId: number, couponName: string): Promise<ApiResult<AdminCoupon>> {
  return requestApi<AdminCoupon>(`/admin/coupons/${couponId}/name`, {
    method: 'PATCH',
    body: JSON.stringify({ couponName }),
  });
}
