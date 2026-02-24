import { requestApi } from './request';
import type { Activity, ApiResult } from './types';

export async function GetActivities(): Promise<ApiResult<Activity[]>> {
  return requestApi<Activity[]>('/admin/activities', {
    method: 'GET',
  });
}
