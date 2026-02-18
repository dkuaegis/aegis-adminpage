import { requestApi } from './request';
import type { AdminPointGrantResult, ApiResult } from './types';

interface PointGrantPayload {
  requestId: string;
  memberId: number;
  amount: number;
  reason: string;
}

export async function postPointGrant(payload: PointGrantPayload): Promise<ApiResult<AdminPointGrantResult>> {
  return requestApi<AdminPointGrantResult>('/admin/points/grants', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
