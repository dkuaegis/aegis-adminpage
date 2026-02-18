import { requestApi } from './request';
import type { AdminMemberRecordTimelineItem, ApiResult } from './types';

export async function getMemberRecordTimeline(memberId: number): Promise<ApiResult<AdminMemberRecordTimelineItem[]>> {
  return requestApi<AdminMemberRecordTimelineItem[]>(`/admin/members/${memberId}/records`, {
    method: 'GET',
  });
}
