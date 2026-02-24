import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import type { AdminPaymentItem } from "@/api/payment/types";
import {
  AdminDataTable,
  AdminFilterBar,
  AdminSectionCard,
} from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  PaymentSectionActions,
  PaymentSectionState,
  PaymentStatusFilter,
  YearSemesterOption,
} from "../hooks/usePaymentPageState";

interface PaymentManagementSectionProps {
  yearSemesterOptions: YearSemesterOption[];
  state: PaymentSectionState;
  actions: PaymentSectionActions;
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleString("ko-KR", { hour12: false });
}

export const PaymentManagementSection: React.FC<
  PaymentManagementSectionProps
> = ({ yearSemesterOptions, state, actions }) => {
  const columns = useMemo<ColumnDef<AdminPaymentItem>[]>(() => {
    return [
      {
        id: "id",
        accessorKey: "paymentId",
        header: "ID",
        enableSorting: true,
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
        id: "yearSemester",
        accessorKey: "yearSemester",
        header: "학기",
      },
      {
        id: "status",
        accessorKey: "status",
        header: "상태",
        enableSorting: true,
      },
      {
        id: "finalPrice",
        accessorKey: "finalPrice",
        header: "금액",
        enableSorting: true,
        meta: {
          headerClassName: "text-right",
          cellClassName: "text-right",
        },
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: "생성일",
        enableSorting: true,
        cell: ({ row }) => formatDateTime(row.original.createdAt),
      },
      {
        id: "actions",
        header: "동작",
        cell: ({ row }) => {
          const payment = row.original;

          return (
            <Button
              size="sm"
              variant="outline"
              onClick={() => void actions.forceComplete(payment.paymentId)}
              disabled={
                payment.status !== "PENDING" ||
                state.forceCompletingPaymentId === payment.paymentId
              }
            >
              {state.forceCompletingPaymentId === payment.paymentId
                ? "처리 중..."
                : "강제 완료"}
            </Button>
          );
        },
      },
    ];
  }, [actions, state.forceCompletingPaymentId]);

  return (
    <AdminSectionCard
      title="Payment 조회 및 강제 완료"
      contentClassName="space-y-4"
    >
      <AdminFilterBar className="md:grid-cols-6">
        <Select
          value={state.yearSemester}
          onValueChange={actions.setYearSemester}
        >
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

        <Select
          value={state.status}
          onValueChange={(value) =>
            actions.setStatus(value as PaymentStatusFilter)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체 상태</SelectItem>
            <SelectItem value="PENDING">PENDING</SelectItem>
            <SelectItem value="COMPLETED">COMPLETED</SelectItem>
          </SelectContent>
        </Select>

        <Input
          value={state.memberKeyword}
          onChange={(event) => actions.setMemberKeyword(event.target.value)}
          placeholder="회원명/학번"
        />
        <div className="md:col-span-2" />
        <Button
          onClick={() => void actions.search()}
          disabled={state.isLoading}
        >
          조회
        </Button>
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
        loadingMessage="결제 목록을 불러오는 중..."
        emptyMessage="조회 결과가 없습니다."
        getRowId={(row) => String(row.paymentId)}
      />
    </AdminSectionCard>
  );
};
