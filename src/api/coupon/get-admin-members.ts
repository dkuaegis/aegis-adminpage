import { requestApi } from './request';
import type { AdminMemberSummary, ApiResult } from './types';

export async function getAdminMembers(): Promise<ApiResult<AdminMemberSummary[]>> {
  return requestApi<AdminMemberSummary[]>('/admin/members', { method: 'GET' });
}
