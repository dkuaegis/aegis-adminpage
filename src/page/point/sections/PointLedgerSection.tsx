import type {
  ColumnDef,
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import { useMemo } from "react";

import type {
  AdminPointLedgerItem,
  AdminPointLedgerPage,
} from "@/api/point/types";
import { AdminDataTable } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { PointTransactionFilter } from "../hooks/usePointPageState";

type PointLedgerSectionProps = {
  isLedgerLoading: boolean;
  ledgerData: AdminPointLedgerPage | null;
  ledgerPagination: PaginationState;
  ledgerMemberKeyword: string;
  ledgerTransactionType: PointTransactionFilter;
  ledgerSorting: SortingState;
  ledgerFrom: string;
  ledgerTo: string;
  onLedgerMemberKeywordChange: (value: string) => void;
  onLedgerTransactionTypeChange: (value: PointTransactionFilter) => void;
  onLedgerSortingChange: (updater: Updater<SortingState>) => void;
  onLedgerPaginationChange: (updater: Updater<PaginationState>) => void;
  onLedgerFromChange: (value: string) => void;
  onLedgerToChange: (value: string) => void;
  onLedgerSearch: () => Promise<void>;
  formatDateTime: (value: string) => string;
};

export const PointLedgerSection: React.FC<PointLedgerSectionProps> = ({
  isLedgerLoading,
  ledgerData,
  ledgerPagination,
  ledgerMemberKeyword,
  ledgerTransactionType,
  ledgerSorting,
  ledgerFrom,
  ledgerTo,
  onLedgerMemberKeywordChange,
  onLedgerTransactionTypeChange,
  onLedgerSortingChange,
  onLedgerPaginationChange,
  onLedgerFromChange,
  onLedgerToChange,
  onLedgerSearch,
  formatDateTime,
}) => {
  const columns = useMemo<ColumnDef<AdminPointLedgerItem>[]>(() => {
    return [
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: "시간",
        enableSorting: true,
        sortDescFirst: true,
        cell: ({ row }) => formatDateTime(row.original.createdAt),
      },
      {
        id: "memberName",
        accessorKey: "memberName",
        header: "회원",
        enableSorting: true,
      },
      {
        id: "studentId",
        accessorKey: "studentId",
        header: "학번",
        cell: ({ row }) => row.original.studentId ?? "-",
      },
      {
        id: "transactionType",
        accessorKey: "transactionType",
        header: "유형",
        enableSorting: true,
        cell: ({ row }) =>
          row.original.transactionType === "EARN" ? "적립" : "차감",
      },
      {
        id: "amount",
        accessorKey: "amount",
        header: "금액",
        enableSorting: true,
        meta: {
          headerClassName: "text-right",
          cellClassName: "text-right",
        },
      },
      {
        id: "reason",
        accessorKey: "reason",
        header: "사유",
      },
    ];
  }, [formatDateTime]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>통합 포인트 원장</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <Input
            value={ledgerMemberKeyword}
            onChange={(event) =>
              onLedgerMemberKeywordChange(event.target.value)
            }
            placeholder="회원명/학번"
          />

          <Select
            value={ledgerTransactionType}
            onValueChange={(value) =>
              onLedgerTransactionTypeChange(value as PointTransactionFilter)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체 유형</SelectItem>
              <SelectItem value="EARN">적립</SelectItem>
              <SelectItem value="SPEND">차감</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={ledgerFrom}
            onChange={(event) => onLedgerFromChange(event.target.value)}
          />
          <Input
            type="date"
            value={ledgerTo}
            onChange={(event) => onLedgerToChange(event.target.value)}
          />
          <Button
            onClick={() => void onLedgerSearch()}
            disabled={isLedgerLoading}
          >
            조회
          </Button>
        </div>

        <AdminDataTable
          columns={columns}
          data={ledgerData?.content ?? []}
          sorting={ledgerSorting}
          onSortingChange={onLedgerSortingChange}
          pagination={ledgerPagination}
          onPaginationChange={onLedgerPaginationChange}
          pageCount={ledgerData?.totalPages ?? 1}
          totalElements={ledgerData?.totalElements ?? 0}
          isLoading={isLedgerLoading}
          loadingMessage="원장을 불러오는 중..."
          emptyMessage="조회 결과가 없습니다."
          getRowId={(row) => String(row.pointTransactionId)}
        />
      </CardContent>
    </Card>
  );
};
