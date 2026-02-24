import {
  AdminFilterBar,
  AdminSectionCard,
  AdminTableEmptyRow,
} from "@/components/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type {
  PaymentSectionActions,
  PaymentSectionState,
  PaymentStatusFilter,
  YearSemesterOption,
} from "../hooks/usePaymentPageState"

interface PaymentManagementSectionProps {
  yearSemesterOptions: YearSemesterOption[]
  state: PaymentSectionState
  actions: PaymentSectionActions
}

function formatDateTime(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return "-"
  }
  return parsed.toLocaleString("ko-KR", { hour12: false })
}

export const PaymentManagementSection: React.FC<PaymentManagementSectionProps> = ({
  yearSemesterOptions,
  state,
  actions,
}) => {
  return (
    <AdminSectionCard title="Payment 조회 및 강제 완료" contentClassName="space-y-4">
      <AdminFilterBar className="md:grid-cols-6">
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

        <Select
          value={state.status}
          onValueChange={(value) => actions.setStatus(value as PaymentStatusFilter)}
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
        <Button onClick={() => void actions.search()} disabled={state.isLoading}>
          조회
        </Button>
      </AdminFilterBar>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>회원</TableHead>
              <TableHead>학번</TableHead>
              <TableHead>학기</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>금액</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead>동작</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.data?.content.map((payment) => (
              <TableRow key={payment.paymentId}>
                <TableCell>{payment.paymentId}</TableCell>
                <TableCell>{payment.memberName}</TableCell>
                <TableCell>{payment.studentId ?? "-"}</TableCell>
                <TableCell>{payment.yearSemester}</TableCell>
                <TableCell>{payment.status}</TableCell>
                <TableCell>{payment.finalPrice}</TableCell>
                <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void actions.forceComplete(payment.paymentId)}
                    disabled={
                      payment.status !== "PENDING" ||
                      state.forceCompletingPaymentId === payment.paymentId
                    }
                  >
                    {state.forceCompletingPaymentId === payment.paymentId ? "처리 중..." : "강제 완료"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {(state.data?.content.length ?? 0) === 0 && (
              <AdminTableEmptyRow
                colSpan={8}
                isLoading={state.isLoading}
                loadingMessage="결제 목록을 불러오는 중..."
                emptyMessage="조회 결과가 없습니다."
              />
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">
          총 {state.data?.totalElements ?? 0}건 / {state.data ? state.data.page + 1 : 1}페이지
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void actions.movePage(state.page - 1)}
            disabled={state.isLoading || state.page <= 0}
          >
            이전
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void actions.movePage(state.page + 1)}
            disabled={state.isLoading || !(state.data?.hasNext ?? false)}
          >
            다음
          </Button>
        </div>
      </div>
    </AdminSectionCard>
  )
}
