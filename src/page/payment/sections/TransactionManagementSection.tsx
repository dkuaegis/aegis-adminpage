import { useMemo } from "react"

import type { ColumnDef } from "@tanstack/react-table"

import type { AdminTransactionItem } from "@/api/payment/types"
import { AdminDataTable, AdminFilterBar, AdminSectionCard } from "@/components/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type {
  TransactionSectionActions,
  TransactionSectionState,
  TransactionTypeFilter,
  YearSemesterOption,
} from "../hooks/usePaymentPageState"

interface TransactionManagementSectionProps {
  yearSemesterOptions: YearSemesterOption[]
  state: TransactionSectionState
  actions: TransactionSectionActions
}

function formatDateTime(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return "-"
  }
  return parsed.toLocaleString("ko-KR", { hour12: false })
}

export const TransactionManagementSection: React.FC<TransactionManagementSectionProps> = ({
  yearSemesterOptions,
  state,
  actions,
}) => {
  const columns = useMemo<ColumnDef<AdminTransactionItem>[]>(() => {
    return [
      {
        id: "transactionTime",
        accessorKey: "transactionTime",
        header: "시간",
        enableSorting: true,
        sortDescFirst: true,
        cell: ({ row }) => formatDateTime(row.original.transactionTime),
      },
      {
        id: "id",
        accessorKey: "transactionId",
        header: "ID",
        enableSorting: true,
      },
      {
        id: "yearSemester",
        accessorKey: "yearSemester",
        header: "학기",
      },
      {
        id: "depositorName",
        accessorKey: "depositorName",
        header: "입금자",
        enableSorting: true,
      },
      {
        id: "transactionType",
        accessorKey: "transactionType",
        header: "유형",
        cell: ({ row }) => (row.original.transactionType === "DEPOSIT" ? "입금" : "출금"),
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
        id: "balance",
        accessorKey: "balance",
        header: "잔액",
        enableSorting: true,
        meta: {
          headerClassName: "text-right",
          cellClassName: "text-right",
        },
      },
    ]
  }, [])

  return (
    <AdminSectionCard title="Transaction 조회" contentClassName="space-y-4">
      <AdminFilterBar className="md:grid-cols-7">
        <Select value={state.yearSemester} onValueChange={actions.setYearSemester}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체 학기</SelectItem>
            {yearSemesterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={state.type} onValueChange={(value) => actions.setType(value as TransactionTypeFilter)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체 유형</SelectItem>
            <SelectItem value="DEPOSIT">입금</SelectItem>
            <SelectItem value="WITHDRAWAL">출금</SelectItem>
          </SelectContent>
        </Select>

        <Input
          value={state.depositorKeyword}
          onChange={(event) => actions.setDepositorKeyword(event.target.value)}
          placeholder="입금자명"
        />
        <Input type="date" value={state.from} onChange={(event) => actions.setFrom(event.target.value)} />
        <Input type="date" value={state.to} onChange={(event) => actions.setTo(event.target.value)} />
        <div className="md:col-span-2">
          <Button onClick={() => void actions.search()} disabled={state.isLoading}>
            조회
          </Button>
        </div>
      </AdminFilterBar>

      <AdminDataTable
        columns={columns}
        data={state.data?.content ?? []}
        sorting={state.sorting}
        onSortingChange={actions.onSortingChange}
        pagination={state.pagination}
        onPaginationChange={actions.onPaginationChange}
        pageCount={state.data?.totalPages ?? 1}
        totalElements={state.data?.totalElements ?? 0}
        isLoading={state.isLoading}
        loadingMessage="거래 목록을 불러오는 중..."
        emptyMessage="조회 결과가 없습니다."
        getRowId={(row) => String(row.transactionId)}
      />
    </AdminSectionCard>
  )
}
