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

        <Select
          value={state.type}
          onValueChange={(value) => actions.setType(value as TransactionTypeFilter)}
        >
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

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>시간</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>학기</TableHead>
              <TableHead>입금자</TableHead>
              <TableHead>유형</TableHead>
              <TableHead>금액</TableHead>
              <TableHead>잔액</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.data?.content.map((transaction) => (
              <TableRow key={transaction.transactionId}>
                <TableCell>{formatDateTime(transaction.transactionTime)}</TableCell>
                <TableCell>{transaction.transactionId}</TableCell>
                <TableCell>{transaction.yearSemester}</TableCell>
                <TableCell>{transaction.depositorName}</TableCell>
                <TableCell>{transaction.transactionType === "DEPOSIT" ? "입금" : "출금"}</TableCell>
                <TableCell>{transaction.amount}</TableCell>
                <TableCell>{transaction.balance}</TableCell>
              </TableRow>
            ))}

            {(state.data?.content.length ?? 0) === 0 && (
              <AdminTableEmptyRow
                colSpan={7}
                isLoading={state.isLoading}
                loadingMessage="거래 목록을 불러오는 중..."
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
