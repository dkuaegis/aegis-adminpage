import { requestApi } from '../coupon/request';
import type { AdminFeatureFlags } from './types';

export const updateMemberSignupFlag = (
  enabled: boolean,
): Promise<import('../coupon/types').ApiResult<AdminFeatureFlags>> => {
  return requestApi<AdminFeatureFlags>('/admin/feature-flags/member-signup', {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  });
};
