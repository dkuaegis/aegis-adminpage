import { useEffect, useState } from "react"

import { getAdminPayments } from "@/api/payment/get-admin-payments"
import { getAdminTransactions } from "@/api/payment/get-admin-transactions"
import { patchForceCompletePayment } from "@/api/payment/patch-force-complete-payment"
import type {
  AdminPaymentPage,
  AdminTransactionPage,
  PaymentStatus,
  TransactionType,
} from "@/api/payment/types"
import {
  AdminFilterBar,
  AdminPageHeader,
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
import { resolveAdminErrorMessage } from "@/lib/errors/admin-error"
import { showConfirm, showError, showSuccess } from "@/utils/alert"

type YearSemesterFilter = "ALL" | string
type PaymentStatusFilter = "ALL" | PaymentStatus
type TransactionTypeFilter = "ALL" | TransactionType

const YEAR_SEMESTER_OPTIONS = [
  { value: "YEAR_SEMESTER_2025_1", label: "2025-1" },
  { value: "YEAR_SEMESTER_2025_2", label: "2025-2" },
  { value: "YEAR_SEMESTER_2026_1", label: "2026-1" },
]

function formatDateTime(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return "-"
  }
  return parsed.toLocaleString("ko-KR", { hour12: false })
}

const paymentErrorOverrides: Record<string, string> = {
  PAYMENT_NOT_FOUND: "결제 정보를 찾을 수 없습니다.",
  PAYMENT_ALREADY_COMPLETED: "이미 완료된 결제입니다.",
}

const resolvePaymentErrorMessage = (errorName?: string): string => {
  return resolveAdminErrorMessage(errorName, { overrides: paymentErrorOverrides })
}

const PaymentPage: React.FC = () => {
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false)
  const [paymentData, setPaymentData] = useState<AdminPaymentPage | null>(null)
  const [paymentPage, setPaymentPage] = useState(0)
  const [paymentYearSemester, setPaymentYearSemester] = useState<YearSemesterFilter>("ALL")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusFilter>("ALL")
  const [paymentMemberKeyword, setPaymentMemberKeyword] = useState("")
  const [forceCompletingPaymentId, setForceCompletingPaymentId] = useState<number | null>(null)

  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false)
  const [transactionData, setTransactionData] = useState<AdminTransactionPage | null>(null)
  const [transactionPage, setTransactionPage] = useState(0)
  const [transactionYearSemester, setTransactionYearSemester] = useState<YearSemesterFilter>("ALL")
  const [transactionType, setTransactionType] = useState<TransactionTypeFilter>("ALL")
  const [transactionDepositorKeyword, setTransactionDepositorKeyword] = useState("")
  const [transactionFrom, setTransactionFrom] = useState("")
  const [transactionTo, setTransactionTo] = useState("")

  const fetchPayments = async (
    page: number,
    yearSemester: YearSemesterFilter,
    status: PaymentStatusFilter,
    memberKeyword: string,
  ): Promise<void> => {
    setIsPaymentsLoading(true)
    const response = await getAdminPayments({
      page,
      size: 50,
      yearSemester: yearSemester === "ALL" ? undefined : yearSemester,
      status: status === "ALL" ? undefined : status,
      memberKeyword,
    })

    if (!response.ok || !response.data) {
      showError(resolvePaymentErrorMessage(response.errorName))
      setIsPaymentsLoading(false)
      return
    }

    setPaymentData(response.data)
    setIsPaymentsLoading(false)
  }

  const fetchTransactions = async (
    page: number,
    yearSemester: YearSemesterFilter,
    type: TransactionTypeFilter,
    depositorKeyword: string,
    from: string,
    to: string,
  ): Promise<void> => {
    setIsTransactionsLoading(true)
    const response = await getAdminTransactions({
      page,
      size: 50,
      yearSemester: yearSemester === "ALL" ? undefined : yearSemester,
      transactionType: type === "ALL" ? undefined : type,
      depositorKeyword,
      from: from || undefined,
      to: to || undefined,
    })

    if (!response.ok || !response.data) {
      showError(resolvePaymentErrorMessage(response.errorName))
      setIsTransactionsLoading(false)
      return
    }

    setTransactionData(response.data)
    setIsTransactionsLoading(false)
  }

  useEffect(() => {
    void fetchPayments(0, paymentYearSemester, paymentStatus, paymentMemberKeyword)
    void fetchTransactions(
      0,
      transactionYearSemester,
      transactionType,
      transactionDepositorKeyword,
      transactionFrom,
      transactionTo,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePaymentSearch = async (): Promise<void> => {
    setPaymentPage(0)
    await fetchPayments(0, paymentYearSemester, paymentStatus, paymentMemberKeyword)
  }

  const movePaymentPage = async (nextPage: number): Promise<void> => {
    if (nextPage < 0) {
      return
    }
    setPaymentPage(nextPage)
    await fetchPayments(nextPage, paymentYearSemester, paymentStatus, paymentMemberKeyword)
  }

  const handleForceComplete = async (paymentId: number): Promise<void> => {
    const firstConfirmed = await showConfirm("위험한 작업입니다. 해당 결제를 강제로 완료 처리하시겠습니까?")
    if (!firstConfirmed) {
      return
    }

    const secondConfirmed = await showConfirm(
      "최종 확인: 결제 완료 이벤트가 즉시 반영됩니다. 정말 실행하시겠습니까?",
    )
    if (!secondConfirmed) {
      return
    }

    setForceCompletingPaymentId(paymentId)
    const response = await patchForceCompletePayment(paymentId)

    if (!response.ok || !response.data) {
      showError(resolvePaymentErrorMessage(response.errorName))
      setForceCompletingPaymentId(null)
      return
    }

    showSuccess(`결제 #${response.data.paymentId}를 완료 처리했습니다.`)

    await fetchPayments(paymentPage, paymentYearSemester, paymentStatus, paymentMemberKeyword)
    await fetchTransactions(
      transactionPage,
      transactionYearSemester,
      transactionType,
      transactionDepositorKeyword,
      transactionFrom,
      transactionTo,
    )
    setForceCompletingPaymentId(null)
  }

  const handleTransactionSearch = async (): Promise<void> => {
    if (transactionFrom && transactionTo && transactionFrom > transactionTo) {
      showError("조회 시작일은 종료일보다 늦을 수 없습니다.")
      return
    }

    setTransactionPage(0)
    await fetchTransactions(
      0,
      transactionYearSemester,
      transactionType,
      transactionDepositorKeyword,
      transactionFrom,
      transactionTo,
    )
  }

  const moveTransactionPage = async (nextPage: number): Promise<void> => {
    if (nextPage < 0) {
      return
    }
    setTransactionPage(nextPage)
    await fetchTransactions(
      nextPage,
      transactionYearSemester,
      transactionType,
      transactionDepositorKeyword,
      transactionFrom,
      transactionTo,
    )
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="결제 관리"
        description="Payment 조회/강제 완료, Transaction 조회 기능을 제공합니다."
      />

      <AdminSectionCard title="Payment 조회 및 강제 완료" contentClassName="space-y-4">
        <AdminFilterBar className="md:grid-cols-6">
            <Select value={paymentYearSemester} onValueChange={setPaymentYearSemester}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 학기</SelectItem>
                {YEAR_SEMESTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as PaymentStatusFilter)}>
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
              value={paymentMemberKeyword}
              onChange={(event) => setPaymentMemberKeyword(event.target.value)}
              placeholder="회원명/학번"
            />
            <div className="md:col-span-2" />
            <Button onClick={() => void handlePaymentSearch()} disabled={isPaymentsLoading}>
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
                {paymentData?.content.map((payment) => (
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
                        onClick={() => void handleForceComplete(payment.paymentId)}
                        disabled={payment.status !== "PENDING" || forceCompletingPaymentId === payment.paymentId}
                      >
                        {forceCompletingPaymentId === payment.paymentId ? "처리 중..." : "강제 완료"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {(paymentData?.content.length ?? 0) === 0 && (
                  <AdminTableEmptyRow
                    colSpan={8}
                    isLoading={isPaymentsLoading}
                    loadingMessage="결제 목록을 불러오는 중..."
                    emptyMessage="조회 결과가 없습니다."
                  />
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
              총 {paymentData?.totalElements ?? 0}건 / {paymentData ? paymentData.page + 1 : 1}페이지
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void movePaymentPage(paymentPage - 1)}
                disabled={isPaymentsLoading || paymentPage <= 0}
              >
                이전
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void movePaymentPage(paymentPage + 1)}
                disabled={isPaymentsLoading || !(paymentData?.hasNext ?? false)}
              >
                다음
              </Button>
            </div>
          </div>
      </AdminSectionCard>

      <AdminSectionCard title="Transaction 조회" contentClassName="space-y-4">
        <AdminFilterBar className="md:grid-cols-7">
            <Select value={transactionYearSemester} onValueChange={setTransactionYearSemester}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 학기</SelectItem>
                {YEAR_SEMESTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={transactionType} onValueChange={(value) => setTransactionType(value as TransactionTypeFilter)}>
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
              value={transactionDepositorKeyword}
              onChange={(event) => setTransactionDepositorKeyword(event.target.value)}
              placeholder="입금자명"
            />
            <Input type="date" value={transactionFrom} onChange={(event) => setTransactionFrom(event.target.value)} />
            <Input type="date" value={transactionTo} onChange={(event) => setTransactionTo(event.target.value)} />
            <div className="md:col-span-2">
              <Button onClick={() => void handleTransactionSearch()} disabled={isTransactionsLoading}>
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
                {transactionData?.content.map((transaction) => (
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

                {(transactionData?.content.length ?? 0) === 0 && (
                  <AdminTableEmptyRow
                    colSpan={7}
                    isLoading={isTransactionsLoading}
                    loadingMessage="거래 목록을 불러오는 중..."
                    emptyMessage="조회 결과가 없습니다."
                  />
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
              총 {transactionData?.totalElements ?? 0}건 / {transactionData ? transactionData.page + 1 : 1}페이지
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void moveTransactionPage(transactionPage - 1)}
                disabled={isTransactionsLoading || transactionPage <= 0}
              >
                이전
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void moveTransactionPage(transactionPage + 1)}
                disabled={isTransactionsLoading || !(transactionData?.hasNext ?? false)}
              >
                다음
              </Button>
            </div>
          </div>
      </AdminSectionCard>
    </div>
  )
}

export default PaymentPage
