import { requestApi } from './request';
import type { AdminPaymentPage, ApiResult, PaymentStatus } from './types';

export interface AdminPaymentsQuery {
  page?: number;
  size?: number;
  yearSemester?: string;
  status?: PaymentStatus;
  memberKeyword?: string;
}

export async function getAdminPayments(query: AdminPaymentsQuery): Promise<ApiResult<AdminPaymentPage>> {
  const params = new URLSearchParams();

  params.set('page', String(query.page ?? 0));
  params.set('size', String(query.size ?? 50));

  if (query.yearSemester) {
    params.set('yearSemester', query.yearSemester);
  }
  if (query.status) {
    params.set('status', query.status);
  }
  if (query.memberKeyword && query.memberKeyword.trim().length > 0) {
    params.set('memberKeyword', query.memberKeyword.trim());
  }

  return requestApi<AdminPaymentPage>(`/admin/payments?${params.toString()}`, {
    method: 'GET',
  });
}
