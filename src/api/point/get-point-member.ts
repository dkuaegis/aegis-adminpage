import { requestApi } from './request';
import type { AdminPointMemberPoint, ApiResult } from './types';

export async function getPointMember(memberId: number): Promise<ApiResult<AdminPointMemberPoint>> {
  return requestApi<AdminPointMemberPoint>(`/admin/points/members/${memberId}`, {
    method: 'GET',
  });
}
