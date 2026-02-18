import { requestApi } from './request';
import type { AdminMemberSemesterActivityDetail, ApiResult } from './types';

export async function getMemberSemesterActivities(
  memberId: number,
  yearSemester: string,
): Promise<ApiResult<AdminMemberSemesterActivityDetail>> {
  const params = new URLSearchParams();
  params.set('yearSemester', yearSemester);

  return requestApi<AdminMemberSemesterActivityDetail>(
    `/admin/members/${memberId}/activities?${params.toString()}`,
    {
      method: 'GET',
    },
  );
}
