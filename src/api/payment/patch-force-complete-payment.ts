import { requestApi } from './request';
import type { AdminPaymentItem, ApiResult } from './types';

export async function patchForceCompletePayment(paymentId: number): Promise<ApiResult<AdminPaymentItem>> {
  return requestApi<AdminPaymentItem>(`/admin/payments/${paymentId}/complete`, {
    method: 'PATCH',
  });
}
