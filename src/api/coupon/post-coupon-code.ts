import { requestApi } from './request';
import type { AdminCouponCode, ApiResult } from './types';

export async function createCouponCode(couponId: number, description: string | null): Promise<ApiResult<AdminCouponCode>> {
  return requestApi<AdminCouponCode>('/admin/coupons/code', {
    method: 'POST',
    body: JSON.stringify({ couponId, description }),
  });
}
