import { requestApi } from './request';
import type { ApiResult } from './types';

export interface MemberActivityRequest {
  activityId: number;
  memberId: number;
}

export async function PostMemberActivities(
  activityId: number,
  memberId: number,
): Promise<ApiResult<unknown>> {
  const requestBody: MemberActivityRequest = {
    activityId,
    memberId,
  };

  return requestApi('/admin/activity-participation', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
}
