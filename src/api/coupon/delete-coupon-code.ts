import { requestApi } from './request';
import type { ApiResult } from './types';

export async function deleteCouponCode(codeCouponId: number): Promise<ApiResult<null>> {
  return requestApi<null>(`/admin/coupons/code/${codeCouponId}`, { method: 'DELETE' });
}
