export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  errorName?: string;
}

export type PointTransactionType = 'EARN' | 'SPEND';

export interface AdminPointLedgerItem {
  pointTransactionId: number;
  memberId: number;
  studentId: string | null;
  memberName: string;
  transactionType: PointTransactionType;
  amount: number;
  reason: string;
  createdAt: string;
  idempotencyKey: string | null;
}

export interface AdminPointLedgerPage {
  content: AdminPointLedgerItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface PointTransactionHistory {
  pointTransactionId: number;
  transactionType: PointTransactionType;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface AdminPointMemberPoint {
  memberId: number;
  studentId: string | null;
  memberName: string;
  balance: number;
  totalEarned: number;
  recentHistory: PointTransactionHistory[];
}

export interface AdminPointMemberSearch {
  memberId: number;
  studentId: string | null;
  memberName: string;
}

export interface AdminPointGrantResult {
  created: boolean;
  pointTransactionId: number | null;
  memberId: number;
  newBalance: number;
}

export type AdminPointBatchGrantStatus = 'SUCCESS' | 'DUPLICATE' | 'FAILED';

export interface AdminPointBatchGrantMemberResult {
  memberId: number;
  status: AdminPointBatchGrantStatus;
  pointTransactionId: number | null;
  newBalance: number | null;
  errorName: string | null;
}

export interface AdminPointBatchGrantResult {
  totalRequested: number;
  successCount: number;
  duplicateCount: number;
  failureCount: number;
  results: AdminPointBatchGrantMemberResult[];
}
