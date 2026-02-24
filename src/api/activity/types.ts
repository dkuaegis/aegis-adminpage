export interface Activity {
  activityId: number;
  name: string;
  pointAmount: number;
}

export interface MemberInfo {
  memberId: number;
  name: string;
  studentId: string;
}

export type { ApiResult } from '@/lib/http/types';
