import { requestApi } from './request';
import type { AdminCouponCode, ApiResult } from './types';

export async function getCouponCodes(): Promise<ApiResult<AdminCouponCode[]>> {
  return requestApi<AdminCouponCode[]>('/admin/coupons/code', { method: 'GET' });
}
