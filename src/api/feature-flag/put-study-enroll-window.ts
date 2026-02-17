import { requestApi } from '../coupon/request';
import type { AdminFeatureFlags } from './types';

interface UpdateStudyEnrollWindowPayload {
  openAt: string;
  closeAt: string;
}

export const updateStudyEnrollWindowFlag = ({
  openAt,
  closeAt,
}: UpdateStudyEnrollWindowPayload): Promise<import('../coupon/types').ApiResult<AdminFeatureFlags>> => {
  return requestApi<AdminFeatureFlags>('/admin/feature-flags/study-enroll-window', {
    method: 'PUT',
    body: JSON.stringify({ openAt, closeAt }),
  });
};
