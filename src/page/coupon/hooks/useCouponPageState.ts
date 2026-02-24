import { useEffect, useMemo, useState } from "react"

import type { PaginationState, SortingState, Updater } from "@tanstack/react-table"
import { functionalUpdate } from "@tanstack/react-table"

import { createSortingState, normalizeSingleSorting, serializeSortingState } from "@/components/admin"
import type { ColumnSortMap } from "@/components/admin"
import { createCoupon } from "@/api/coupon/post-coupon"
import { createCouponCode } from "@/api/coupon/post-coupon-code"
import { createIssuedCoupons } from "@/api/coupon/post-issued-coupons"
import { deleteCoupon } from "@/api/coupon/delete-coupon"
import { deleteCouponCode } from "@/api/coupon/delete-coupon-code"
import { deleteIssuedCoupon } from "@/api/coupon/delete-issued-coupon"
import { getAdminMembers } from "@/api/coupon/get-admin-members"
import { getCouponCodes } from "@/api/coupon/get-coupon-codes"
import { getCoupons } from "@/api/coupon/get-coupons"
import { getIssuedCoupons } from "@/api/coupon/get-issued-coupons"
import { updateCouponName } from "@/api/coupon/patch-coupon-name"
import type {
  AdminCoupon,
  AdminCouponCodePageResponse,
  AdminCouponPageResponse,
  AdminIssuedCouponPageResponse,
  AdminMemberSummary,
} from "@/api/coupon/types"
import { resolveAdminErrorMessage } from "@/lib/errors/admin-error"
import { showConfirm, showError, showSuccess } from "@/utils/alert"

export type CouponTab = "coupon" | "code" | "issued"

const PAGE_SIZE = 50

const COUPON_SORT_MAP: ColumnSortMap = {
  id: "id",
  name: "couponName",
  discount: "discountAmount",
}

const COUPON_CODE_SORT_MAP: ColumnSortMap = {
  id: "id",
  couponId: "couponId",
  code: "code",
  usedAt: "usedAt",
}

const ISSUED_SORT_MAP: ColumnSortMap = {
  id: "id",
  coupon: "coupon",
  member: "member",
  usedAt: "usedAt",
}

const DEFAULT_COUPON_SORTING = createSortingState("id", false)
const DEFAULT_COUPON_CODE_SORTING = createSortingState("id", false)
const DEFAULT_ISSUED_SORTING = createSortingState("id", false)

const couponErrorOverrides: Record<string, string> = {
  COUPON_ALREADY_EXISTS: "동일한 이름과 할인 금액을 가진 쿠폰이 이미 존재합니다.",
  COUPON_NOT_FOUND: "쿠폰을 찾을 수 없습니다.",
  COUPON_ISSUED_COUPON_EXISTS: "발급된 쿠폰이 남아 있어 쿠폰을 삭제할 수 없습니다.",
  COUPON_CODE_ALREADY_USED_CANNOT_DELETE: "이미 사용된 쿠폰 코드는 삭제할 수 없습니다.",
  ISSUED_COUPON_ALREADY_USED: "이미 사용된 쿠폰 발급 내역은 삭제할 수 없습니다.",
  COUPON_CODE_CANNOT_ISSUE_CODE: "쿠폰 코드 생성에 실패했습니다. 잠시 후 다시 시도해주세요.",
}

const resolveCouponErrorMessage = (errorName?: string): string => {
  return resolveAdminErrorMessage(errorName, { overrides: couponErrorOverrides })
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "-"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return "-"
  }

  return parsed.toLocaleString("ko-KR", {
    hour12: false,
  })
}

export interface CouponPageState {
  tab: CouponTab
  setTab: (nextTab: CouponTab) => void
  isDataLoading: boolean
  searchDraft: string
  setSearchDraft: (value: string) => void
  appliedKeyword: string
  handleApplySearch: () => void

  newCouponName: string
  setNewCouponName: (value: string) => void
  newDiscountAmount: string
  setNewDiscountAmount: (value: string) => void
  couponNameDrafts: Record<number, string>
  handleCouponNameDraftChange: (couponId: number, value: string) => void

  selectedCouponIdForCode: number
  setSelectedCouponIdForCode: (couponId: number) => void
  newCouponCodeDescription: string
  setNewCouponCodeDescription: (description: string) => void

  selectedCouponIdForIssue: number
  setSelectedCouponIdForIssue: (couponId: number) => void
  memberSearchText: string
  setMemberSearchText: (value: string) => void
  selectedMemberIdsForIssue: number[]

  coupons: AdminCoupon[]
  couponPage: AdminCouponPageResponse | null
  couponCodePage: AdminCouponCodePageResponse | null
  issuedCouponPage: AdminIssuedCouponPageResponse | null

  couponSorting: SortingState
  couponPagination: PaginationState
  couponCodeSorting: SortingState
  couponCodePagination: PaginationState
  issuedSorting: SortingState
  issuedPagination: PaginationState

  handleCouponSortingChange: (updater: Updater<SortingState>) => void
  handleCouponPaginationChange: (updater: Updater<PaginationState>) => void
  handleCouponCodeSortingChange: (updater: Updater<SortingState>) => void
  handleCouponCodePaginationChange: (updater: Updater<PaginationState>) => void
  handleIssuedSortingChange: (updater: Updater<SortingState>) => void
  handleIssuedPaginationChange: (updater: Updater<PaginationState>) => void

  filteredMembersForIssue: AdminMemberSummary[]
  selectedMemberIdSet: Set<number>
  isAllFilteredMembersSelected: boolean
  selectedAmongFilteredCount: number

  handleCreateCoupon: () => Promise<void>
  handleUpdateCouponName: (couponId: number) => Promise<void>
  handleDeleteCoupon: (couponId: number) => Promise<void>
  handleCreateCouponCode: () => Promise<void>
  handleDeleteCouponCode: (codeCouponId: number) => Promise<void>
  handleCreateIssuedCoupons: () => Promise<void>
  handleDeleteIssuedCoupon: (issuedCouponId: number) => Promise<void>
  handleToggleMemberForIssue: (memberId: number) => void
  handleSelectAllFilteredMembers: () => void
  handleClearAllSelectedMembers: () => void
  handleClearFilteredMembers: () => void
}

export const useCouponPageState = (): CouponPageState => {
  const [tab, setTab] = useState<CouponTab>("coupon")
  const [searchDraft, setSearchDraft] = useState("")
  const [appliedKeyword, setAppliedKeyword] = useState("")

  const [isCouponLoading, setIsCouponLoading] = useState(false)
  const [isCouponCodeLoading, setIsCouponCodeLoading] = useState(false)
  const [isIssuedLoading, setIsIssuedLoading] = useState(false)

  const [couponPage, setCouponPage] = useState<AdminCouponPageResponse | null>(null)
  const [couponCodePage, setCouponCodePage] = useState<AdminCouponCodePageResponse | null>(null)
  const [issuedCouponPage, setIssuedCouponPage] = useState<AdminIssuedCouponPageResponse | null>(null)

  const [coupons, setCoupons] = useState<AdminCoupon[]>([])
  const [couponNameDrafts, setCouponNameDrafts] = useState<Record<number, string>>({})

  const [members, setMembers] = useState<AdminMemberSummary[]>([])
  const [memberSearchText, setMemberSearchText] = useState("")
  const [selectedMemberIdsForIssue, setSelectedMemberIdsForIssue] = useState<number[]>([])

  const [newCouponName, setNewCouponName] = useState("")
  const [newDiscountAmount, setNewDiscountAmount] = useState("5000")

  const [selectedCouponIdForCode, setSelectedCouponIdForCode] = useState<number>(0)
  const [newCouponCodeDescription, setNewCouponCodeDescription] = useState("")
  const [selectedCouponIdForIssue, setSelectedCouponIdForIssue] = useState<number>(0)

  const [couponSorting, setCouponSorting] = useState<SortingState>(DEFAULT_COUPON_SORTING)
  const [couponPagination, setCouponPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })

  const [couponCodeSorting, setCouponCodeSorting] = useState<SortingState>(DEFAULT_COUPON_CODE_SORTING)
  const [couponCodePagination, setCouponCodePagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })

  const [issuedSorting, setIssuedSorting] = useState<SortingState>(DEFAULT_ISSUED_SORTING)
  const [issuedPagination, setIssuedPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })

  const isDataLoading = tab === "coupon" ? isCouponLoading : tab === "code" ? isCouponCodeLoading : isIssuedLoading

  const fetchCouponOptions = async (): Promise<void> => {
    const response = await getCoupons({
      page: 0,
      size: 100,
      sort: "id,asc",
    })

    if (!response.ok) {
      showError(resolveCouponErrorMessage(response.errorName))
      return
    }
    const data = response.data
    if (!data) {
      showError(resolveCouponErrorMessage())
      return
    }

    setCoupons(data.content)
    setCouponNameDrafts((prevDrafts) => {
      const nextDrafts: Record<number, string> = {}
      data.content.forEach((coupon) => {
        nextDrafts[coupon.couponId] = prevDrafts[coupon.couponId] ?? coupon.couponName
      })
      return nextDrafts
    })
  }

  const fetchMembers = async (): Promise<void> => {
    const membersRes = await getAdminMembers()

    if (membersRes.ok && membersRes.data) {
      setMembers([...membersRes.data].sort((a, b) => a.memberId - b.memberId))
      return
    }

    showError("회원 목록을 가져오지 못했습니다.")
  }

  const fetchCouponPage = async (
    pagination: PaginationState,
    sorting: SortingState,
    keyword: string,
  ): Promise<void> => {
    setIsCouponLoading(true)

    const response = await getCoupons({
      page: pagination.pageIndex,
      size: pagination.pageSize,
      sort: serializeSortingState(sorting, COUPON_SORT_MAP, "id,asc"),
      keyword: keyword || undefined,
    })

    if (!response.ok) {
      showError(resolveCouponErrorMessage(response.errorName))
      setCouponPage(null)
      setIsCouponLoading(false)
      return
    }
    const data = response.data
    if (!data) {
      showError(resolveCouponErrorMessage())
      setCouponPage(null)
      setIsCouponLoading(false)
      return
    }

    setCouponPage(data)
    setCouponPagination((prev) => {
      if (prev.pageIndex === data.page && prev.pageSize === data.size) {
        return prev
      }
      return {
        ...prev,
        pageIndex: data.page,
        pageSize: data.size,
      }
    })

    setIsCouponLoading(false)
  }

  const fetchCouponCodePage = async (
    pagination: PaginationState,
    sorting: SortingState,
    keyword: string,
  ): Promise<void> => {
    setIsCouponCodeLoading(true)

    const response = await getCouponCodes({
      page: pagination.pageIndex,
      size: pagination.pageSize,
      sort: serializeSortingState(sorting, COUPON_CODE_SORT_MAP, "id,asc"),
      keyword: keyword || undefined,
    })

    if (!response.ok) {
      showError(resolveCouponErrorMessage(response.errorName))
      setCouponCodePage(null)
      setIsCouponCodeLoading(false)
      return
    }
    const data = response.data
    if (!data) {
      showError(resolveCouponErrorMessage())
      setCouponCodePage(null)
      setIsCouponCodeLoading(false)
      return
    }

    setCouponCodePage(data)
    setCouponCodePagination((prev) => {
      if (prev.pageIndex === data.page && prev.pageSize === data.size) {
        return prev
      }
      return {
        ...prev,
        pageIndex: data.page,
        pageSize: data.size,
      }
    })

    setIsCouponCodeLoading(false)
  }

  const fetchIssuedCouponPage = async (
    pagination: PaginationState,
    sorting: SortingState,
    keyword: string,
  ): Promise<void> => {
    setIsIssuedLoading(true)

    const response = await getIssuedCoupons({
      page: pagination.pageIndex,
      size: pagination.pageSize,
      sort: serializeSortingState(sorting, ISSUED_SORT_MAP, "id,asc"),
      keyword: keyword || undefined,
    })

    if (!response.ok) {
      showError(resolveCouponErrorMessage(response.errorName))
      setIssuedCouponPage(null)
      setIsIssuedLoading(false)
      return
    }
    const data = response.data
    if (!data) {
      showError(resolveCouponErrorMessage())
      setIssuedCouponPage(null)
      setIsIssuedLoading(false)
      return
    }

    setIssuedCouponPage(data)
    setIssuedPagination((prev) => {
      if (prev.pageIndex === data.page && prev.pageSize === data.size) {
        return prev
      }
      return {
        ...prev,
        pageIndex: data.page,
        pageSize: data.size,
      }
    })

    setIsIssuedLoading(false)
  }

  useEffect(() => {
    void Promise.all([fetchCouponOptions(), fetchMembers()])
  }, [])

  useEffect(() => {
    if (coupons.length === 0) {
      setSelectedCouponIdForCode(0)
      setSelectedCouponIdForIssue(0)
      return
    }

    if (!coupons.some((coupon) => coupon.couponId === selectedCouponIdForCode)) {
      setSelectedCouponIdForCode(coupons[0].couponId)
    }

    if (!coupons.some((coupon) => coupon.couponId === selectedCouponIdForIssue)) {
      setSelectedCouponIdForIssue(coupons[0].couponId)
    }
  }, [coupons, selectedCouponIdForCode, selectedCouponIdForIssue])

  useEffect(() => {
    if (tab !== "coupon") {
      return
    }

    void fetchCouponPage(couponPagination, couponSorting, appliedKeyword)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, couponPagination.pageIndex, couponPagination.pageSize, couponSorting, appliedKeyword])

  useEffect(() => {
    if (tab !== "code") {
      return
    }

    void fetchCouponCodePage(couponCodePagination, couponCodeSorting, appliedKeyword)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, couponCodePagination.pageIndex, couponCodePagination.pageSize, couponCodeSorting, appliedKeyword])

  useEffect(() => {
    if (tab !== "issued") {
      return
    }

    void fetchIssuedCouponPage(issuedPagination, issuedSorting, appliedKeyword)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, issuedPagination.pageIndex, issuedPagination.pageSize, issuedSorting, appliedKeyword])

  const handleApplySearch = (): void => {
    const nextKeyword = searchDraft.trim()

    setAppliedKeyword(nextKeyword)

    if (tab === "coupon") {
      setCouponPagination((prev) => ({
        ...prev,
        pageIndex: 0,
      }))
      return
    }

    if (tab === "code") {
      setCouponCodePagination((prev) => ({
        ...prev,
        pageIndex: 0,
      }))
      return
    }

    setIssuedPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }))
  }

  const handleCouponSortingChange = (updater: Updater<SortingState>): void => {
    setCouponSorting((prev) => normalizeSingleSorting(updater, prev, DEFAULT_COUPON_SORTING))
    setCouponPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }))
  }

  const handleCouponPaginationChange = (updater: Updater<PaginationState>): void => {
    const nextPagination = functionalUpdate(updater, couponPagination)

    if (nextPagination.pageIndex < 0) {
      return
    }

    if (couponPage && nextPagination.pageIndex >= couponPage.totalPages) {
      return
    }

    setCouponPagination(nextPagination)
  }

  const handleCouponCodeSortingChange = (updater: Updater<SortingState>): void => {
    setCouponCodeSorting((prev) => normalizeSingleSorting(updater, prev, DEFAULT_COUPON_CODE_SORTING))
    setCouponCodePagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }))
  }

  const handleCouponCodePaginationChange = (updater: Updater<PaginationState>): void => {
    const nextPagination = functionalUpdate(updater, couponCodePagination)

    if (nextPagination.pageIndex < 0) {
      return
    }

    if (couponCodePage && nextPagination.pageIndex >= couponCodePage.totalPages) {
      return
    }

    setCouponCodePagination(nextPagination)
  }

  const handleIssuedSortingChange = (updater: Updater<SortingState>): void => {
    setIssuedSorting((prev) => normalizeSingleSorting(updater, prev, DEFAULT_ISSUED_SORTING))
    setIssuedPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }))
  }

  const handleIssuedPaginationChange = (updater: Updater<PaginationState>): void => {
    const nextPagination = functionalUpdate(updater, issuedPagination)

    if (nextPagination.pageIndex < 0) {
      return
    }

    if (issuedCouponPage && nextPagination.pageIndex >= issuedCouponPage.totalPages) {
      return
    }

    setIssuedPagination(nextPagination)
  }

  const memberKeyword = memberSearchText.trim().toLowerCase()

  const filteredMembersForIssue = useMemo(() => {
    if (!memberKeyword) {
      return members
    }

    return members.filter((member) => {
      return (
        member.name.toLowerCase().includes(memberKeyword) ||
        member.email.toLowerCase().includes(memberKeyword) ||
        (member.studentId ?? "").toLowerCase().includes(memberKeyword) ||
        member.role.toLowerCase().includes(memberKeyword) ||
        String(member.memberId).includes(memberKeyword)
      )
    })
  }, [members, memberKeyword])

  const selectedMemberIdSet = useMemo(() => new Set(selectedMemberIdsForIssue), [selectedMemberIdsForIssue])

  const filteredMemberIdSet = useMemo(
    () => new Set(filteredMembersForIssue.map((member) => member.memberId)),
    [filteredMembersForIssue],
  )

  const isAllFilteredMembersSelected =
    filteredMembersForIssue.length > 0 &&
    filteredMembersForIssue.every((member) => selectedMemberIdSet.has(member.memberId))

  const selectedAmongFilteredCount = useMemo(() => {
    return selectedMemberIdsForIssue.filter((memberId) => filteredMemberIdSet.has(memberId)).length
  }, [filteredMemberIdSet, selectedMemberIdsForIssue])

  const handleCreateCoupon = async (): Promise<void> => {
    if (!newCouponName.trim()) {
      showError("쿠폰 이름을 입력해주세요.")
      return
    }

    const parsedDiscountAmount = Number(newDiscountAmount)
    if (!Number.isFinite(parsedDiscountAmount) || parsedDiscountAmount <= 0) {
      showError("할인 금액은 0보다 커야 합니다.")
      return
    }

    const response = await createCoupon(newCouponName, parsedDiscountAmount)
    if (!response.ok) {
      showError(resolveCouponErrorMessage(response.errorName))
      return
    }

    showSuccess("쿠폰을 생성했습니다.")
    setNewCouponName("")
    await Promise.all([
      fetchCouponOptions(),
      fetchCouponPage(couponPagination, couponSorting, appliedKeyword),
    ])
  }

  const handleUpdateCouponName = async (couponId: number): Promise<void> => {
    const draftName = couponNameDrafts[couponId] ?? ""
    if (!draftName.trim()) {
      showError("쿠폰 이름을 입력해주세요.")
      return
    }

    const response = await updateCouponName(couponId, draftName)
    if (!response.ok) {
      showError(resolveCouponErrorMessage(response.errorName))
      return
    }

    showSuccess("쿠폰 이름을 수정했습니다.")
    await Promise.all([
      fetchCouponOptions(),
      fetchCouponPage(couponPagination, couponSorting, appliedKeyword),
    ])
  }

  const handleDeleteCoupon = async (couponId: number): Promise<void> => {
    const confirmed = await showConfirm("쿠폰을 삭제하시겠습니까?")
    if (!confirmed) {
      return
    }

    const response = await deleteCoupon(couponId)
    if (!response.ok) {
      showError(resolveCouponErrorMessage(response.errorName))
      return
    }

    showSuccess("쿠폰을 삭제했습니다.")
    await Promise.all([
      fetchCouponOptions(),
      fetchCouponPage(couponPagination, couponSorting, appliedKeyword),
    ])
  }

  const handleCreateCouponCode = async (): Promise<void> => {
    if (!selectedCouponIdForCode) {
      showError("코드를 생성할 쿠폰을 선택해주세요.")
      return
    }

    const normalizedDescription = newCouponCodeDescription.trim() || null
    const response = await createCouponCode(selectedCouponIdForCode, normalizedDescription)
    if (!response.ok) {
      showError(resolveCouponErrorMessage(response.errorName))
      return
    }

    showSuccess("쿠폰 코드를 생성했습니다.")
    setNewCouponCodeDescription("")
    await fetchCouponCodePage(couponCodePagination, couponCodeSorting, appliedKeyword)
  }

  const handleDeleteCouponCode = async (codeCouponId: number): Promise<void> => {
    const confirmed = await showConfirm("쿠폰 코드를 삭제하시겠습니까?")
    if (!confirmed) {
      return
    }

    const response = await deleteCouponCode(codeCouponId)
    if (!response.ok) {
      showError(resolveCouponErrorMessage(response.errorName))
      return
    }

    showSuccess("쿠폰 코드를 삭제했습니다.")
    await fetchCouponCodePage(couponCodePagination, couponCodeSorting, appliedKeyword)
  }

  const handleCreateIssuedCoupons = async (): Promise<void> => {
    if (!selectedCouponIdForIssue) {
      showError("발급할 쿠폰을 선택해주세요.")
      return
    }

    if (selectedMemberIdsForIssue.length === 0) {
      showError("발급할 회원을 선택해주세요.")
      return
    }

    const response = await createIssuedCoupons(selectedCouponIdForIssue, selectedMemberIdsForIssue)
    if (!response.ok) {
      showError(resolveCouponErrorMessage(response.errorName))
      return
    }

    showSuccess(`${response.data?.length ?? 0}건의 쿠폰 발급을 완료했습니다.`)
    setSelectedMemberIdsForIssue([])
    await fetchIssuedCouponPage(issuedPagination, issuedSorting, appliedKeyword)
  }

  const handleDeleteIssuedCoupon = async (issuedCouponId: number): Promise<void> => {
    const confirmed = await showConfirm("발급된 쿠폰을 삭제하시겠습니까?")
    if (!confirmed) {
      return
    }

    const response = await deleteIssuedCoupon(issuedCouponId)
    if (!response.ok) {
      showError(resolveCouponErrorMessage(response.errorName))
      return
    }

    showSuccess("발급된 쿠폰을 삭제했습니다.")
    await fetchIssuedCouponPage(issuedPagination, issuedSorting, appliedKeyword)
  }

  const handleToggleMemberForIssue = (memberId: number): void => {
    setSelectedMemberIdsForIssue((prevIds) => {
      if (prevIds.includes(memberId)) {
        return prevIds.filter((id) => id !== memberId)
      }

      return [...prevIds, memberId]
    })
  }

  const handleSelectAllFilteredMembers = (): void => {
    setSelectedMemberIdsForIssue((prevIds) => {
      const nextIds = new Set(prevIds)
      filteredMembersForIssue.forEach((member) => {
        nextIds.add(member.memberId)
      })

      return Array.from(nextIds)
    })
  }

  const handleClearAllSelectedMembers = (): void => {
    setSelectedMemberIdsForIssue([])
  }

  const handleClearFilteredMembers = (): void => {
    setSelectedMemberIdsForIssue((prevIds) => {
      return prevIds.filter((memberId) => !filteredMemberIdSet.has(memberId))
    })
  }

  const handleCouponNameDraftChange = (couponId: number, value: string): void => {
    setCouponNameDrafts((prev) => ({
      ...prev,
      [couponId]: value,
    }))
  }

  return {
    tab,
    setTab,
    isDataLoading,
    searchDraft,
    setSearchDraft,
    appliedKeyword,
    handleApplySearch,
    newCouponName,
    setNewCouponName,
    newDiscountAmount,
    setNewDiscountAmount,
    couponNameDrafts,
    handleCouponNameDraftChange,
    selectedCouponIdForCode,
    setSelectedCouponIdForCode,
    newCouponCodeDescription,
    setNewCouponCodeDescription,
    selectedCouponIdForIssue,
    setSelectedCouponIdForIssue,
    memberSearchText,
    setMemberSearchText,
    selectedMemberIdsForIssue,
    coupons,
    couponPage,
    couponCodePage,
    issuedCouponPage,
    couponSorting,
    couponPagination,
    couponCodeSorting,
    couponCodePagination,
    issuedSorting,
    issuedPagination,
    handleCouponSortingChange,
    handleCouponPaginationChange,
    handleCouponCodeSortingChange,
    handleCouponCodePaginationChange,
    handleIssuedSortingChange,
    handleIssuedPaginationChange,
    filteredMembersForIssue,
    selectedMemberIdSet,
    isAllFilteredMembersSelected,
    selectedAmongFilteredCount,
    handleCreateCoupon,
    handleUpdateCouponName,
    handleDeleteCoupon,
    handleCreateCouponCode,
    handleDeleteCouponCode,
    handleCreateIssuedCoupons,
    handleDeleteIssuedCoupon,
    handleToggleMemberForIssue,
    handleSelectAllFilteredMembers,
    handleClearAllSelectedMembers,
    handleClearFilteredMembers,
  }
}
