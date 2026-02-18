import { requestApi } from './request';
import type { AdminPointBatchGrantResult, ApiResult } from './types';

interface PointBatchGrantPayload {
  requestId: string;
  memberIds: number[];
  amount: number;
  reason: string;
}

export async function postPointBatchGrant(
  payload: PointBatchGrantPayload,
): Promise<ApiResult<AdminPointBatchGrantResult>> {
  return requestApi<AdminPointBatchGrantResult>('/admin/points/grants/batch', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
