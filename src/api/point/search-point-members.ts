import { requestApi } from './request';
import type { AdminPointMemberSearch, ApiResult } from './types';

export async function searchPointMembers(keyword: string, limit = 20): Promise<ApiResult<AdminPointMemberSearch[]>> {
  const params = new URLSearchParams();
  params.set('keyword', keyword.trim());
  params.set('limit', String(limit));

  return requestApi<AdminPointMemberSearch[]>(`/admin/points/members/search?${params.toString()}`, {
    method: 'GET',
  });
}
