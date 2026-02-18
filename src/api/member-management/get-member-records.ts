import { requestApi } from './request';
import type { AdminMemberRecordPage, ApiResult, MemberRole } from './types';

export interface MemberRecordsQuery {
  yearSemester: string;
  page?: number;
  size?: number;
  keyword?: string;
  role?: MemberRole;
  sort?: string;
}

export async function getMemberRecords(query: MemberRecordsQuery): Promise<ApiResult<AdminMemberRecordPage>> {
  const params = new URLSearchParams();

  params.set('yearSemester', query.yearSemester);
  params.set('page', String(query.page ?? 0));
  params.set('size', String(query.size ?? 50));

  if (query.keyword && query.keyword.trim().length > 0) {
    params.set('keyword', query.keyword.trim());
  }
  if (query.role) {
    params.set('role', query.role);
  }
  if (query.sort) {
    params.set('sort', query.sort);
  }

  return requestApi<AdminMemberRecordPage>(`/admin/members/records?${params.toString()}`, {
    method: 'GET',
  });
}
