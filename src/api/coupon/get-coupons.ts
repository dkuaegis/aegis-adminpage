import { requestApi } from './request';
import type { AdminCoupon, ApiResult } from './types';

export async function getCoupons(): Promise<ApiResult<AdminCoupon[]>> {
  return requestApi<AdminCoupon[]>('/admin/coupons', { method: 'GET' });
}
