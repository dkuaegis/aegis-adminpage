import { requestApi } from './request';
import type { AdminIssuedCoupon, ApiResult } from './types';

export async function getIssuedCoupons(): Promise<ApiResult<AdminIssuedCoupon[]>> {
  return requestApi<AdminIssuedCoupon[]>('/admin/coupons/issued', { method: 'GET' });
}
