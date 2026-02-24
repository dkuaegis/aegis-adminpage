import { requestApi } from './request';
import type { ApiResult } from './types';

export interface MemberActivityRequest {
  name: string;
  pointAmount: number;
}

export async function PostMemberActivities(
  name: string,
  pointAmount: number,
): Promise<ApiResult<unknown>> {
  const requestBody: MemberActivityRequest = {
    name,
    pointAmount,
  };

  return requestApi('/admin/activities', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
}
