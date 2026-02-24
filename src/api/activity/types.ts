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

export interface AdminActivityPageResponse {
  content: Activity[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export type { ApiResult } from "@/lib/http/types";
