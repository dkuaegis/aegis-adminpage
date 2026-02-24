export type { ApiResult } from "@/lib/http/types";

export type PaymentStatus = "PENDING" | "COMPLETED";
export type TransactionType = "DEPOSIT" | "WITHDRAWAL";

export interface AdminPaymentItem {
  paymentId: number;
  memberId: number;
  memberName: string;
  studentId: string | null;
  yearSemester: string;
  status: PaymentStatus;
  originalPrice: number;
  finalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPaymentPage {
  content: AdminPaymentItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface AdminTransactionItem {
  transactionId: number;
  yearSemester: string;
  transactionTime: string;
  depositorName: string;
  transactionType: TransactionType;
  amount: number;
  balance: number;
  createdAt: string;
}

export interface AdminTransactionPage {
  content: AdminTransactionItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}
