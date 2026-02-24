import { useEffect, useMemo, useState } from "react"

import type { PaginationState, SortingState, Updater } from "@tanstack/react-table"
import { functionalUpdate } from "@tanstack/react-table"

import { createSortingState, normalizeSingleSorting, serializeSortingState } from "@/components/admin"
import type { ColumnSortMap } from "@/components/admin"
import { getPointLedger } from "@/api/point/get-point-ledger"
import { getPointMember } from "@/api/point/get-point-member"
import { postPointBatchGrant } from "@/api/point/post-point-batch-grant"
import { postPointGrant } from "@/api/point/post-point-grant"
import { searchPointMembers } from "@/api/point/search-point-members"
import type {
  AdminPointBatchGrantResult,
  AdminPointLedgerPage,
  AdminPointMemberPoint,
  AdminPointMemberSearch,
  PointTransactionType,
} from "@/api/point/types"
import { resolveAdminErrorMessage } from "@/lib/errors/admin-error"
import { showConfirm, showError, showSuccess } from "@/utils/alert"

export type PointTransactionFilter = "ALL" | PointTransactionType

const PAGE_SIZE = 50

const LEDGER_SORT_MAP: ColumnSortMap = {
  id: "id",
  createdAt: "createdAt",
  memberName: "memberName",
  transactionType: "transactionType",
  amount: "amount",
}

const DEFAULT_LEDGER_SORTING = createSortingState("id", true)

const pointErrorOverrides: Record<string, string> = {
  POINT_ACCOUNT_NOT_FOUND: "포인트 계정을 찾을 수 없습니다.",
  POINT_ACTION_AMOUNT_NOT_POSITIVE: "포인트 금액은 0보다 커야 합니다.",
}

const resolvePointErrorMessage = (errorName?: string): string => {
  return resolveAdminErrorMessage(errorName, { overrides: pointErrorOverrides })
}

const formatDateTime = (value: string): string => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return "-"
  }
  return parsed.toLocaleString("ko-KR", { hour12: false })
}

const createRequestId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16)
    const value = char === "x" ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

export const usePointPageState = () => {
  const [isLedgerLoading, setIsLedgerLoading] = useState(false)
  const [ledgerData, setLedgerData] = useState<AdminPointLedgerPage | null>(null)
  const [ledgerPagination, setLedgerPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })
  const [ledgerMemberKeyword, setLedgerMemberKeyword] = useState("")
  const [ledgerTransactionType, setLedgerTransactionType] = useState<PointTransactionFilter>("ALL")
  const [ledgerSorting, setLedgerSorting] = useState<SortingState>(DEFAULT_LEDGER_SORTING)
  const [ledgerFrom, setLedgerFrom] = useState("")
  const [ledgerTo, setLedgerTo] = useState("")

  const [memberSearchKeyword, setMemberSearchKeyword] = useState("")
  const [isMemberSearchLoading, setIsMemberSearchLoading] = useState(false)
  const [memberSearchResults, setMemberSearchResults] = useState<AdminPointMemberSearch[]>([])
  const [memberCache, setMemberCache] = useState<Record<number, AdminPointMemberSearch>>({})

  const [selectedDetailMemberId, setSelectedDetailMemberId] = useState<number | null>(null)
  const [isMemberPointLoading, setIsMemberPointLoading] = useState(false)
  const [memberPoint, setMemberPoint] = useState<AdminPointMemberPoint | null>(null)

  const [singleMemberId, setSingleMemberId] = useState<number | null>(null)
  const [singleAmount, setSingleAmount] = useState("")
  const [singleReason, setSingleReason] = useState("")
  const [isSingleSubmitting, setIsSingleSubmitting] = useState(false)

  const [selectedBatchMemberIds, setSelectedBatchMemberIds] = useState<number[]>([])
  const [batchAmount, setBatchAmount] = useState("")
  const [batchReason, setBatchReason] = useState("")
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false)
  const [batchResult, setBatchResult] = useState<AdminPointBatchGrantResult | null>(null)

  const fetchLedger = async (
    pagination: PaginationState,
    memberKeyword: string,
    transactionType: PointTransactionFilter,
    sorting: SortingState,
    from: string,
    to: string,
  ): Promise<void> => {
    setIsLedgerLoading(true)

    const response = await getPointLedger({
      page: pagination.pageIndex,
      size: pagination.pageSize,
      memberKeyword,
      transactionType: transactionType === "ALL" ? undefined : transactionType,
      sort: serializeSortingState(sorting, LEDGER_SORT_MAP, "id,desc"),
      from: from || undefined,
      to: to || undefined,
    })

    if (!response.ok) {
      showError(resolvePointErrorMessage(response.errorName))
      setIsLedgerLoading(false)
      return
    }
    const data = response.data
    if (!data) {
      showError(resolvePointErrorMessage())
      setIsLedgerLoading(false)
      return
    }

    setLedgerData(data)
    setLedgerPagination((prev) => ({
      ...prev,
      pageIndex: data.page,
      pageSize: data.size,
    }))
    setIsLedgerLoading(false)
  }

  const fetchMemberPoint = async (memberId: number): Promise<void> => {
    setIsMemberPointLoading(true)
    const response = await getPointMember(memberId)
    if (!response.ok || !response.data) {
      showError(resolvePointErrorMessage(response.errorName))
      setIsMemberPointLoading(false)
      return
    }

    setSelectedDetailMemberId(memberId)
    setMemberPoint(response.data)
    setSingleMemberId(memberId)
    setIsMemberPointLoading(false)
  }

  useEffect(() => {
    void fetchLedger(
      ledgerPagination,
      ledgerMemberKeyword,
      ledgerTransactionType,
      ledgerSorting,
      ledgerFrom,
      ledgerTo,
    )
  }, [])

  const selectedBatchMembers = useMemo(() => {
    return selectedBatchMemberIds
      .map((memberId) => memberCache[memberId])
      .filter((member): member is AdminPointMemberSearch => Boolean(member))
  }, [memberCache, selectedBatchMemberIds])

  const selectedBatchMemberIdSet = useMemo(() => new Set(selectedBatchMemberIds), [selectedBatchMemberIds])

  const handleLedgerSearch = async (): Promise<void> => {
    if (ledgerFrom && ledgerTo && ledgerFrom > ledgerTo) {
      showError("조회 시작일은 종료일보다 늦을 수 없습니다.")
      return
    }

    const nextPagination = {
      ...ledgerPagination,
      pageIndex: 0,
    }

    setLedgerPagination(nextPagination)
    await fetchLedger(
      nextPagination,
      ledgerMemberKeyword,
      ledgerTransactionType,
      ledgerSorting,
      ledgerFrom,
      ledgerTo,
    )
  }

  const handleLedgerSortingChange = (updater: Updater<SortingState>): void => {
    const nextSorting = normalizeSingleSorting(updater, ledgerSorting, DEFAULT_LEDGER_SORTING)
    const nextPagination = {
      ...ledgerPagination,
      pageIndex: 0,
    }

    setLedgerSorting(nextSorting)
    setLedgerPagination(nextPagination)
    void fetchLedger(
      nextPagination,
      ledgerMemberKeyword,
      ledgerTransactionType,
      nextSorting,
      ledgerFrom,
      ledgerTo,
    )
  }

  const handleLedgerPaginationChange = (updater: Updater<PaginationState>): void => {
    const nextPagination = functionalUpdate(updater, ledgerPagination)

    if (nextPagination.pageIndex < 0) {
      return
    }

    if (ledgerData && nextPagination.pageIndex >= ledgerData.totalPages) {
      return
    }

    setLedgerPagination(nextPagination)
    void fetchLedger(
      nextPagination,
      ledgerMemberKeyword,
      ledgerTransactionType,
      ledgerSorting,
      ledgerFrom,
      ledgerTo,
    )
  }

  const handleSearchMembers = async (): Promise<void> => {
    if (memberSearchKeyword.trim().length < 2) {
      showError("회원 검색어는 2글자 이상 입력해주세요.")
      return
    }

    setIsMemberSearchLoading(true)
    const response = await searchPointMembers(memberSearchKeyword, 20)
    if (!response.ok || !response.data) {
      showError(resolvePointErrorMessage(response.errorName))
      setIsMemberSearchLoading(false)
      return
    }

    setMemberSearchResults(response.data)
    setMemberCache((prev) => {
      const next = { ...prev }
      response.data?.forEach((member) => {
        next[member.memberId] = member
      })
      return next
    })
    setIsMemberSearchLoading(false)
  }

  const toggleBatchMember = (member: AdminPointMemberSearch): void => {
    setSelectedBatchMemberIds((prev) => {
      if (prev.includes(member.memberId)) {
        return prev.filter((memberId) => memberId !== member.memberId)
      }
      return [...prev, member.memberId]
    })
  }

  const handleSingleGrant = async (): Promise<void> => {
    if (!singleMemberId) {
      showError("지급 대상 회원을 선택해주세요.")
      return
    }

    const parsedAmount = Number(singleAmount)
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      showError("지급 포인트는 0보다 큰 정수여야 합니다.")
      return
    }

    const trimmedReason = singleReason.trim()
    if (!trimmedReason) {
      showError("지급 사유를 입력해주세요.")
      return
    }

    setIsSingleSubmitting(true)
    const response = await postPointGrant({
      requestId: createRequestId(),
      memberId: singleMemberId,
      amount: parsedAmount,
      reason: trimmedReason,
    })

    if (!response.ok || !response.data) {
      showError(resolvePointErrorMessage(response.errorName))
      setIsSingleSubmitting(false)
      return
    }

    if (response.data.created) {
      showSuccess("포인트를 지급했습니다.")
    } else {
      showSuccess("중복 요청으로 추가 지급되지 않았습니다.")
    }

    setSingleAmount("")
    await fetchLedger(
      ledgerPagination,
      ledgerMemberKeyword,
      ledgerTransactionType,
      ledgerSorting,
      ledgerFrom,
      ledgerTo,
    )
    if (selectedDetailMemberId !== null) {
      await fetchMemberPoint(selectedDetailMemberId)
    }
    setIsSingleSubmitting(false)
  }

  const handleBatchGrant = async (): Promise<void> => {
    if (selectedBatchMemberIds.length === 0) {
      showError("일괄 지급 대상을 1명 이상 선택해주세요.")
      return
    }

    const parsedAmount = Number(batchAmount)
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      showError("지급 포인트는 0보다 큰 정수여야 합니다.")
      return
    }

    const trimmedReason = batchReason.trim()
    if (!trimmedReason) {
      showError("지급 사유를 입력해주세요.")
      return
    }

    const confirmed = await showConfirm(`선택된 ${selectedBatchMemberIds.length}명에게 일괄 지급하시겠습니까?`)
    if (!confirmed) {
      return
    }

    setIsBatchSubmitting(true)
    const response = await postPointBatchGrant({
      requestId: createRequestId(),
      memberIds: selectedBatchMemberIds,
      amount: parsedAmount,
      reason: trimmedReason,
    })

    if (!response.ok || !response.data) {
      showError(resolvePointErrorMessage(response.errorName))
      setIsBatchSubmitting(false)
      return
    }

    setBatchResult(response.data)
    showSuccess(
      `일괄 지급 완료: 성공 ${response.data.successCount} / 중복 ${response.data.duplicateCount} / 실패 ${response.data.failureCount}`,
    )

    setBatchAmount("")
    await fetchLedger(
      ledgerPagination,
      ledgerMemberKeyword,
      ledgerTransactionType,
      ledgerSorting,
      ledgerFrom,
      ledgerTo,
    )
    if (selectedDetailMemberId !== null) {
      await fetchMemberPoint(selectedDetailMemberId)
    }
    setIsBatchSubmitting(false)
  }

  return {
    formatDateTime,

    isLedgerLoading,
    ledgerData,
    ledgerPagination,
    ledgerMemberKeyword,
    setLedgerMemberKeyword,
    ledgerTransactionType,
    setLedgerTransactionType,
    ledgerSorting,
    onLedgerSortingChange: handleLedgerSortingChange,
    onLedgerPaginationChange: handleLedgerPaginationChange,
    ledgerFrom,
    setLedgerFrom,
    ledgerTo,
    setLedgerTo,
    handleLedgerSearch,

    memberSearchKeyword,
    setMemberSearchKeyword,
    isMemberSearchLoading,
    memberSearchResults,
    selectedBatchMemberIdSet,
    handleSearchMembers,
    toggleBatchMember,

    isMemberPointLoading,
    memberPoint,
    fetchMemberPoint,

    singleMemberId,
    setSingleMemberId,
    singleAmount,
    setSingleAmount,
    singleReason,
    setSingleReason,
    isSingleSubmitting,
    handleSingleGrant,

    selectedBatchMemberIds,
    selectedBatchMembers,
    batchAmount,
    setBatchAmount,
    batchReason,
    setBatchReason,
    isBatchSubmitting,
    batchResult,
    handleBatchGrant,
  }
}
