import { requestApi } from '../coupon/request';

export interface MemberDemoteResponse {
  demotedMemberStudentIds: string[];
}

export const demoteMembersForCurrentSemester = (): Promise<import('../coupon/types').ApiResult<MemberDemoteResponse>> => {
  return requestApi<MemberDemoteResponse>('/admin/members/demote', {
    method: 'POST',
  });
};
