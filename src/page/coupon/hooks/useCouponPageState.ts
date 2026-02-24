import { useEffect, useMemo, useState } from "react"

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
  AdminCouponCode,
  AdminIssuedCoupon,
  AdminMemberSummary,
} from "@/api/coupon/types"
import { resolveAdminErrorMessage } from "@/lib/errors/admin-error"
import { showConfirm, showError, showSuccess } from "@/utils/alert"

export type CouponTab = "coupon" | "code" | "issued"

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
  searchText: string
  setSearchText: (value: string) => void
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
  filteredCoupons: AdminCoupon[]
  filteredCouponCodes: AdminCouponCode[]
  filteredIssuedCoupons: AdminIssuedCoupon[]
  filteredMembersForIssue: AdminMemberSummary[]
  selectedMemberIdSet: Set<number>
  isAllFilteredMembersSelected: boolean
  selectedAmongFilteredCount: number
  currentRows: AdminCoupon[] | AdminCouponCode[] | AdminIssuedCoupon[]
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
  const [isDataLoading, setIsDataLoading] = useState(false)

  const [coupons, setCoupons] = useState<AdminCoupon[]>([])
  const [couponCodes, setCouponCodes] = useState<AdminCouponCode[]>([])
  const [issuedCoupons, setIssuedCoupons] = useState<AdminIssuedCoupon[]>([])
  const [members, setMembers] = useState<AdminMemberSummary[]>([])

  const [searchText, setSearchText] = useState("")
  const [memberSearchText, setMemberSearchText] = useState("")

  const [newCouponName, setNewCouponName] = useState("")
  const [newDiscountAmount, setNewDiscountAmount] = useState("5000")

  const [couponNameDrafts, setCouponNameDrafts] = useState<Record<number, string>>({})

  const [selectedCouponIdForCode, setSelectedCouponIdForCode] = useState<number>(0)
  const [newCouponCodeDescription, setNewCouponCodeDescription] = useState("")
  const [selectedCouponIdForIssue, setSelectedCouponIdForIssue] = useState<number>(0)
  const [selectedMemberIdsForIssue, setSelectedMemberIdsForIssue] = useState<number[]>([])

  const loadAll = async (): Promise<void> => {
    setIsDataLoading(true)
    const [couponsRes, codesRes, issuedRes, membersRes] = await Promise.all([
      getCoupons(),
      getCouponCodes(),
      getIssuedCoupons(),
      getAdminMembers(),
    ])

    if (couponsRes.ok && couponsRes.data) {
      const orderedCoupons = [...couponsRes.data].sort((a, b) => a.couponId - b.couponId)
      setCoupons(orderedCoupons)
      setCouponNameDrafts((prevDrafts) => {
        const nextDrafts: Record<number, string> = {}
        orderedCoupons.forEach((coupon) => {
          nextDrafts[coupon.couponId] = prevDrafts[coupon.couponId] ?? coupon.couponName
        })
        return nextDrafts
      })
    } else {
      showError(resolveCouponErrorMessage(couponsRes.errorName))
    }

    if (codesRes.ok && codesRes.data) {
      setCouponCodes([...codesRes.data].sort((a, b) => a.codeCouponId - b.codeCouponId))
    } else {
      showError(resolveCouponErrorMessage(codesRes.errorName))
    }

    if (issuedRes.ok && issuedRes.data) {
      setIssuedCoupons([...issuedRes.data].sort((a, b) => a.issuedCouponId - b.issuedCouponId))
    } else {
      showError(resolveCouponErrorMessage(issuedRes.errorName))
    }

    if (membersRes.ok && membersRes.data) {
      setMembers([...membersRes.data].sort((a, b) => a.memberId - b.memberId))
    } else {
      showError("회원 목록을 가져오지 못했습니다.")
    }

    setIsDataLoading(false)
  }

  useEffect(() => {
    void loadAll()
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

  const keyword = searchText.trim().toLowerCase()

  const filteredCoupons = useMemo(() => {
    if (!keyword) {
      return coupons
    }

    return coupons.filter((coupon) => {
      return (
        coupon.couponName.toLowerCase().includes(keyword) ||
        String(coupon.couponId).includes(keyword) ||
        String(coupon.discountAmount).includes(keyword)
      )
    })
  }, [coupons, keyword])

  const filteredCouponCodes = useMemo(() => {
    if (!keyword) {
      return couponCodes
    }

    return couponCodes.filter((couponCode) => {
      return (
        couponCode.couponName.toLowerCase().includes(keyword) ||
        couponCode.code.toLowerCase().includes(keyword) ||
        (couponCode.description ?? "").toLowerCase().includes(keyword) ||
        String(couponCode.codeCouponId).includes(keyword) ||
        String(couponCode.couponId).includes(keyword)
      )
    })
  }, [couponCodes, keyword])

  const studentIdByMemberId = useMemo(() => {
    return new Map(members.map((member) => [member.memberId, member.studentId?.toLowerCase() ?? ""]))
  }, [members])

  const filteredIssuedCoupons = useMemo(() => {
    if (!keyword) {
      return issuedCoupons
    }

    return issuedCoupons.filter((issuedCoupon) => {
      const studentId = studentIdByMemberId.get(issuedCoupon.memberId) ?? ""
      return (
        issuedCoupon.couponName.toLowerCase().includes(keyword) ||
        issuedCoupon.memberName.toLowerCase().includes(keyword) ||
        issuedCoupon.memberEmail.toLowerCase().includes(keyword) ||
        studentId.includes(keyword) ||
        String(issuedCoupon.issuedCouponId).includes(keyword) ||
        String(issuedCoupon.memberId).includes(keyword)
      )
    })
  }, [issuedCoupons, keyword, studentIdByMemberId])

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
    await loadAll()
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
    await loadAll()
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
    await loadAll()
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
    await loadAll()
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
    await loadAll()
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
    await loadAll()
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
    await loadAll()
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

  const currentRows =
    tab === "coupon" ? filteredCoupons : tab === "code" ? filteredCouponCodes : filteredIssuedCoupons

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
    searchText,
    setSearchText,
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
    filteredCoupons,
    filteredCouponCodes,
    filteredIssuedCoupons,
    filteredMembersForIssue,
    selectedMemberIdSet,
    isAllFilteredMembersSelected,
    selectedAmongFilteredCount,
    currentRows,
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
