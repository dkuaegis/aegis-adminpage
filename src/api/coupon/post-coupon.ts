import { requestApi } from './request';
import type { AdminCoupon, ApiResult } from './types';

export async function createCoupon(couponName: string, discountAmount: number): Promise<ApiResult<AdminCoupon>> {
  return requestApi<AdminCoupon>('/admin/coupons', {
    method: 'POST',
    body: JSON.stringify({ couponName, discountAmount }),
  });
}
