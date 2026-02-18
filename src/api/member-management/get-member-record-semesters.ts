import { requestApi } from './request';
import type { ApiResult, MemberRecordSemesterOption } from './types';

export async function getMemberRecordSemesters(): Promise<ApiResult<MemberRecordSemesterOption[]>> {
  return requestApi<MemberRecordSemesterOption[]>('/admin/members/records/meta/semesters', {
    method: 'GET',
  });
}
