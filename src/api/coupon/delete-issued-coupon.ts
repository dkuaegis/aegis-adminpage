import { requestApi } from './request';
import type { ApiResult } from './types';

export async function deleteIssuedCoupon(issuedCouponId: number): Promise<ApiResult<null>> {
  return requestApi<null>(`/admin/coupons/issued/${issuedCouponId}`, { method: 'DELETE' });
}
