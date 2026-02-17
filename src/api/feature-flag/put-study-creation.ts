import { requestApi } from '../coupon/request';
import type { AdminFeatureFlags } from './types';

export const updateStudyCreationFlag = (
  enabled: boolean,
): Promise<import('../coupon/types').ApiResult<AdminFeatureFlags>> => {
  return requestApi<AdminFeatureFlags>('/admin/feature-flags/study-creation', {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  });
};
