import { requestApi } from "./request";
import type { AdminTransactionPage, ApiResult, TransactionType } from "./types";

export interface AdminTransactionsQuery {
  page?: number;
  size?: number;
  yearSemester?: string;
  transactionType?: TransactionType;
  depositorKeyword?: string;
  from?: string;
  to?: string;
  sort?: string;
}

export async function getAdminTransactions(
  query: AdminTransactionsQuery
): Promise<ApiResult<AdminTransactionPage>> {
  const params = new URLSearchParams();

  params.set("page", String(query.page ?? 0));
  params.set("size", String(query.size ?? 50));

  if (query.yearSemester) {
    params.set("yearSemester", query.yearSemester);
  }
  if (query.transactionType) {
    params.set("transactionType", query.transactionType);
  }
  if (query.depositorKeyword && query.depositorKeyword.trim().length > 0) {
    params.set("depositorKeyword", query.depositorKeyword.trim());
  }
  if (query.from) {
    params.set("from", query.from);
  }
  if (query.to) {
    params.set("to", query.to);
  }
  if (query.sort) {
    params.set("sort", query.sort);
  }

  return requestApi<AdminTransactionPage>(
    `/admin/payments/transactions?${params.toString()}`,
    {
      method: "GET",
    }
  );
}
