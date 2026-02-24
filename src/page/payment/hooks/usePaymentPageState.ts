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
import { resolveAdminErrorMessage } from "@/lib/errors/admin-error"
import { showConfirm, showError, showSuccess } from "@/utils/alert"

export type YearSemesterFilter = "ALL" | string
export type PaymentStatusFilter = "ALL" | PaymentStatus
export type TransactionTypeFilter = "ALL" | TransactionType

export interface YearSemesterOption {
  value: string
  label: string
}

export interface PaymentSectionState {
  isLoading: boolean
  data: AdminPaymentPage | null
  page: number
  yearSemester: YearSemesterFilter
  status: PaymentStatusFilter
  memberKeyword: string
  forceCompletingPaymentId: number | null
}

export interface PaymentSectionActions {
  setYearSemester: (value: YearSemesterFilter) => void
  setStatus: (value: PaymentStatusFilter) => void
  setMemberKeyword: (value: string) => void
  search: () => Promise<void>
  movePage: (nextPage: number) => Promise<void>
  forceComplete: (paymentId: number) => Promise<void>
}

export interface TransactionSectionState {
  isLoading: boolean
  data: AdminTransactionPage | null
  page: number
  yearSemester: YearSemesterFilter
  type: TransactionTypeFilter
  depositorKeyword: string
  from: string
  to: string
}

export interface TransactionSectionActions {
  setYearSemester: (value: YearSemesterFilter) => void
  setType: (value: TransactionTypeFilter) => void
  setDepositorKeyword: (value: string) => void
  setFrom: (value: string) => void
  setTo: (value: string) => void
  search: () => Promise<void>
  movePage: (nextPage: number) => Promise<void>
}

interface UsePaymentPageStateResult {
  yearSemesterOptions: YearSemesterOption[]
  paymentState: PaymentSectionState
  paymentActions: PaymentSectionActions
  transactionState: TransactionSectionState
  transactionActions: TransactionSectionActions
}

const YEAR_SEMESTER_OPTIONS: YearSemesterOption[] = [
  { value: "YEAR_SEMESTER_2025_1", label: "2025-1" },
  { value: "YEAR_SEMESTER_2025_2", label: "2025-2" },
  { value: "YEAR_SEMESTER_2026_1", label: "2026-1" },
]

const paymentErrorOverrides: Record<string, string> = {
  PAYMENT_NOT_FOUND: "결제 정보를 찾을 수 없습니다.",
  PAYMENT_ALREADY_COMPLETED: "이미 완료된 결제입니다.",
}

const resolvePaymentErrorMessage = (errorName?: string): string => {
  return resolveAdminErrorMessage(errorName, { overrides: paymentErrorOverrides })
}

export function usePaymentPageState(): UsePaymentPageStateResult {
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

  return {
    yearSemesterOptions: YEAR_SEMESTER_OPTIONS,
    paymentState: {
      isLoading: isPaymentsLoading,
      data: paymentData,
      page: paymentPage,
      yearSemester: paymentYearSemester,
      status: paymentStatus,
      memberKeyword: paymentMemberKeyword,
      forceCompletingPaymentId,
    },
    paymentActions: {
      setYearSemester: (value) => setPaymentYearSemester(value),
      setStatus: (value) => setPaymentStatus(value),
      setMemberKeyword: (value) => setPaymentMemberKeyword(value),
      search: handlePaymentSearch,
      movePage: movePaymentPage,
      forceComplete: handleForceComplete,
    },
    transactionState: {
      isLoading: isTransactionsLoading,
      data: transactionData,
      page: transactionPage,
      yearSemester: transactionYearSemester,
      type: transactionType,
      depositorKeyword: transactionDepositorKeyword,
      from: transactionFrom,
      to: transactionTo,
    },
    transactionActions: {
      setYearSemester: (value) => setTransactionYearSemester(value),
      setType: (value) => setTransactionType(value),
      setDepositorKeyword: (value) => setTransactionDepositorKeyword(value),
      setFrom: (value) => setTransactionFrom(value),
      setTo: (value) => setTransactionTo(value),
      search: handleTransactionSearch,
      movePage: moveTransactionPage,
    },
  }
}
