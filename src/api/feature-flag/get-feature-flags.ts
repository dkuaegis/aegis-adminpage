import { requestApi } from '../coupon/request';
import type { AdminFeatureFlags } from './types';

export const getFeatureFlags = (): Promise<import('../coupon/types').ApiResult<AdminFeatureFlags>> => {
  return requestApi<AdminFeatureFlags>('/admin/feature-flags', { method: 'GET' });
};
