import { requestApi } from './request';
import type { ApiResult } from './types';

export async function deleteCoupon(couponId: number): Promise<ApiResult<null>> {
  return requestApi<null>(`/admin/coupons/${couponId}`, { method: 'DELETE' });
}
