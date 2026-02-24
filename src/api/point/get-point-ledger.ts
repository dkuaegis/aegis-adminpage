import { requestApi } from "./request";
import type {
  AdminPointLedgerPage,
  ApiResult,
  PointTransactionType,
} from "./types";

export interface PointLedgerQuery {
  page?: number;
  size?: number;
  memberKeyword?: string;
  transactionType?: PointTransactionType;
  from?: string;
  to?: string;
  sort?: string;
}

export async function getPointLedger(
  query: PointLedgerQuery
): Promise<ApiResult<AdminPointLedgerPage>> {
  const params = new URLSearchParams();

  params.set("page", String(query.page ?? 0));
  params.set("size", String(query.size ?? 50));

  if (query.memberKeyword && query.memberKeyword.trim().length > 0) {
    params.set("memberKeyword", query.memberKeyword.trim());
  }
  if (query.transactionType) {
    params.set("transactionType", query.transactionType);
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

  return requestApi<AdminPointLedgerPage>(
    `/admin/points/ledger?${params.toString()}`,
    {
      method: "GET",
    }
  );
}
