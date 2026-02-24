import { useEffect, useState } from "react"

import type { PaginationState, SortingState, Updater } from "@tanstack/react-table"
import { functionalUpdate } from "@tanstack/react-table"

import { createSortingState, normalizeSingleSorting, serializeSortingState } from "@/components/admin"
import type { ColumnSortMap } from "@/components/admin"
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
  pagination: PaginationState
  yearSemester: YearSemesterFilter
  status: PaymentStatusFilter
  sorting: SortingState
  memberKeyword: string
  forceCompletingPaymentId: number | null
}

export interface PaymentSectionActions {
  setYearSemester: (value: YearSemesterFilter) => void
  setStatus: (value: PaymentStatusFilter) => void
  setMemberKeyword: (value: string) => void
  onSortingChange: (updater: Updater<SortingState>) => void
  onPaginationChange: (updater: Updater<PaginationState>) => void
  search: () => Promise<void>
  forceComplete: (paymentId: number) => Promise<void>
}

export interface TransactionSectionState {
  isLoading: boolean
  data: AdminTransactionPage | null
  pagination: PaginationState
  yearSemester: YearSemesterFilter
  type: TransactionTypeFilter
  sorting: SortingState
  depositorKeyword: string
  from: string
  to: string
}

export interface TransactionSectionActions {
  setYearSemester: (value: YearSemesterFilter) => void
  setType: (value: TransactionTypeFilter) => void
  setDepositorKeyword: (value: string) => void
  onSortingChange: (updater: Updater<SortingState>) => void
  onPaginationChange: (updater: Updater<PaginationState>) => void
  setFrom: (value: string) => void
  setTo: (value: string) => void
  search: () => Promise<void>
}

interface UsePaymentPageStateResult {
  yearSemesterOptions: YearSemesterOption[]
  paymentState: PaymentSectionState
  paymentActions: PaymentSectionActions
  transactionState: TransactionSectionState
  transactionActions: TransactionSectionActions
}

const PAGE_SIZE = 50

const PAYMENT_SORT_MAP: ColumnSortMap = {
  id: "id",
  memberName: "memberName",
  status: "status",
  finalPrice: "finalPrice",
  createdAt: "createdAt",
}

const TRANSACTION_SORT_MAP: ColumnSortMap = {
  transactionTime: "transactionTime",
  id: "id",
  depositorName: "depositorName",
  amount: "amount",
  balance: "balance",
}

const DEFAULT_PAYMENT_SORTING = createSortingState("id", true)
const DEFAULT_TRANSACTION_SORTING = createSortingState("transactionTime", true)

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
  const [paymentPagination, setPaymentPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })
  const [paymentYearSemester, setPaymentYearSemester] = useState<YearSemesterFilter>("ALL")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusFilter>("ALL")
  const [paymentSorting, setPaymentSorting] = useState<SortingState>(DEFAULT_PAYMENT_SORTING)
  const [paymentMemberKeyword, setPaymentMemberKeyword] = useState("")
  const [forceCompletingPaymentId, setForceCompletingPaymentId] = useState<number | null>(null)

  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false)
  const [transactionData, setTransactionData] = useState<AdminTransactionPage | null>(null)
  const [transactionPagination, setTransactionPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })
  const [transactionYearSemester, setTransactionYearSemester] = useState<YearSemesterFilter>("ALL")
  const [transactionType, setTransactionType] = useState<TransactionTypeFilter>("ALL")
  const [transactionSorting, setTransactionSorting] = useState<SortingState>(DEFAULT_TRANSACTION_SORTING)
  const [transactionDepositorKeyword, setTransactionDepositorKeyword] = useState("")
  const [transactionFrom, setTransactionFrom] = useState("")
  const [transactionTo, setTransactionTo] = useState("")

  const fetchPayments = async (
    pagination: PaginationState,
    yearSemester: YearSemesterFilter,
    status: PaymentStatusFilter,
    sorting: SortingState,
    memberKeyword: string,
  ): Promise<void> => {
    setIsPaymentsLoading(true)
    try {
      const response = await getAdminPayments({
        page: pagination.pageIndex,
        size: pagination.pageSize,
        yearSemester: yearSemester === "ALL" ? undefined : yearSemester,
        status: status === "ALL" ? undefined : status,
        sort: serializeSortingState(sorting, PAYMENT_SORT_MAP, "id,desc"),
        memberKeyword,
      })

      if (!response.ok) {
        showError(resolvePaymentErrorMessage(response.errorName))
        return
      }
      const data = response.data
      if (!data) {
        showError(resolvePaymentErrorMessage())
        return
      }

      setPaymentData(data)
      setPaymentPagination((prev) => ({
        ...prev,
        pageIndex: data.page,
        pageSize: data.size,
      }))
    } catch {
      showError(resolvePaymentErrorMessage())
    } finally {
      setIsPaymentsLoading(false)
    }
  }

  const fetchTransactions = async (
    pagination: PaginationState,
    yearSemester: YearSemesterFilter,
    type: TransactionTypeFilter,
    sorting: SortingState,
    depositorKeyword: string,
    from: string,
    to: string,
  ): Promise<void> => {
    setIsTransactionsLoading(true)
    try {
      const response = await getAdminTransactions({
        page: pagination.pageIndex,
        size: pagination.pageSize,
        yearSemester: yearSemester === "ALL" ? undefined : yearSemester,
        transactionType: type === "ALL" ? undefined : type,
        sort: serializeSortingState(sorting, TRANSACTION_SORT_MAP, "transactionTime,desc"),
        depositorKeyword,
        from: from || undefined,
        to: to || undefined,
      })

      if (!response.ok) {
        showError(resolvePaymentErrorMessage(response.errorName))
        return
      }
      const data = response.data
      if (!data) {
        showError(resolvePaymentErrorMessage())
        return
      }

      setTransactionData(data)
      setTransactionPagination((prev) => ({
        ...prev,
        pageIndex: data.page,
        pageSize: data.size,
      }))
    } catch {
      showError(resolvePaymentErrorMessage())
    } finally {
      setIsTransactionsLoading(false)
    }
  }

  useEffect(() => {
    void fetchPayments(
      paymentPagination,
      paymentYearSemester,
      paymentStatus,
      paymentSorting,
      paymentMemberKeyword,
    )
    void fetchTransactions(
      transactionPagination,
      transactionYearSemester,
      transactionType,
      transactionSorting,
      transactionDepositorKeyword,
      transactionFrom,
      transactionTo,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePaymentSearch = async (): Promise<void> => {
    const nextPagination = {
      ...paymentPagination,
      pageIndex: 0,
    }
    setPaymentPagination(nextPagination)
    await fetchPayments(
      nextPagination,
      paymentYearSemester,
      paymentStatus,
      paymentSorting,
      paymentMemberKeyword,
    )
  }

  const handlePaymentSortingChange = (updater: Updater<SortingState>): void => {
    const nextSorting = normalizeSingleSorting(updater, paymentSorting, DEFAULT_PAYMENT_SORTING)
    const nextPagination = {
      ...paymentPagination,
      pageIndex: 0,
    }

    setPaymentSorting(nextSorting)
    setPaymentPagination(nextPagination)
    void fetchPayments(
      nextPagination,
      paymentYearSemester,
      paymentStatus,
      nextSorting,
      paymentMemberKeyword,
    )
  }

  const handlePaymentPaginationChange = (updater: Updater<PaginationState>): void => {
    const nextPagination = functionalUpdate(updater, paymentPagination)

    if (nextPagination.pageIndex < 0) {
      return
    }

    if (paymentData && nextPagination.pageIndex >= paymentData.totalPages) {
      return
    }

    setPaymentPagination(nextPagination)
    void fetchPayments(
      nextPagination,
      paymentYearSemester,
      paymentStatus,
      paymentSorting,
      paymentMemberKeyword,
    )
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
    try {
      const response = await patchForceCompletePayment(paymentId)

      if (!response.ok || !response.data) {
        showError(resolvePaymentErrorMessage(response.errorName))
        return
      }

      showSuccess(`결제 #${response.data.paymentId}를 완료 처리했습니다.`)

      await Promise.all([
        fetchPayments(
          paymentPagination,
          paymentYearSemester,
          paymentStatus,
          paymentSorting,
          paymentMemberKeyword,
        ),
        fetchTransactions(
          transactionPagination,
          transactionYearSemester,
          transactionType,
          transactionSorting,
          transactionDepositorKeyword,
          transactionFrom,
          transactionTo,
        ),
      ])
    } catch {
      showError(resolvePaymentErrorMessage())
    } finally {
      setForceCompletingPaymentId(null)
    }
  }

  const handleTransactionSearch = async (): Promise<void> => {
    if (transactionFrom && transactionTo && transactionFrom > transactionTo) {
      showError("조회 시작일은 종료일보다 늦을 수 없습니다.")
      return
    }

    const nextPagination = {
      ...transactionPagination,
      pageIndex: 0,
    }
    setTransactionPagination(nextPagination)
    await fetchTransactions(
      nextPagination,
      transactionYearSemester,
      transactionType,
      transactionSorting,
      transactionDepositorKeyword,
      transactionFrom,
      transactionTo,
    )
  }

  const handleTransactionSortingChange = (updater: Updater<SortingState>): void => {
    const nextSorting = normalizeSingleSorting(updater, transactionSorting, DEFAULT_TRANSACTION_SORTING)
    const nextPagination = {
      ...transactionPagination,
      pageIndex: 0,
    }

    setTransactionSorting(nextSorting)
    setTransactionPagination(nextPagination)
    void fetchTransactions(
      nextPagination,
      transactionYearSemester,
      transactionType,
      nextSorting,
      transactionDepositorKeyword,
      transactionFrom,
      transactionTo,
    )
  }

  const handleTransactionPaginationChange = (updater: Updater<PaginationState>): void => {
    const nextPagination = functionalUpdate(updater, transactionPagination)

    if (nextPagination.pageIndex < 0) {
      return
    }

    if (transactionData && nextPagination.pageIndex >= transactionData.totalPages) {
      return
    }

    setTransactionPagination(nextPagination)
    void fetchTransactions(
      nextPagination,
      transactionYearSemester,
      transactionType,
      transactionSorting,
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
      pagination: paymentPagination,
      yearSemester: paymentYearSemester,
      status: paymentStatus,
      sorting: paymentSorting,
      memberKeyword: paymentMemberKeyword,
      forceCompletingPaymentId,
    },
    paymentActions: {
      setYearSemester: (value) => setPaymentYearSemester(value),
      setStatus: (value) => setPaymentStatus(value),
      setMemberKeyword: (value) => setPaymentMemberKeyword(value),
      onSortingChange: handlePaymentSortingChange,
      onPaginationChange: handlePaymentPaginationChange,
      search: handlePaymentSearch,
      forceComplete: handleForceComplete,
    },
    transactionState: {
      isLoading: isTransactionsLoading,
      data: transactionData,
      pagination: transactionPagination,
      yearSemester: transactionYearSemester,
      type: transactionType,
      sorting: transactionSorting,
      depositorKeyword: transactionDepositorKeyword,
      from: transactionFrom,
      to: transactionTo,
    },
    transactionActions: {
      setYearSemester: (value) => setTransactionYearSemester(value),
      setType: (value) => setTransactionType(value),
      setDepositorKeyword: (value) => setTransactionDepositorKeyword(value),
      onSortingChange: handleTransactionSortingChange,
      onPaginationChange: handleTransactionPaginationChange,
      setFrom: (value) => setTransactionFrom(value),
      setTo: (value) => setTransactionTo(value),
      search: handleTransactionSearch,
    },
  }
}
