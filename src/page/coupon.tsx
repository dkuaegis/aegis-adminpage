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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { resolveAdminErrorMessage } from "@/lib/errors/admin-error"
import { showError, showSuccess, showWarning } from "@/utils/alert"

type CouponTab = "coupon" | "code" | "issued"

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

function formatDateTime(value: string | null): string {
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

const CouponPage: React.FC = () => {
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
    const confirmed = await showWarning("쿠폰을 삭제하시겠습니까?")
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
    const confirmed = await showWarning("쿠폰 코드를 삭제하시겠습니까?")
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
    const confirmed = await showWarning("발급된 쿠폰을 삭제하시겠습니까?")
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

  const currentRows = tab === "coupon" ? filteredCoupons : tab === "code" ? filteredCouponCodes : filteredIssuedCoupons

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">쿠폰 관리</CardTitle>
            <CardDescription>쿠폰, 쿠폰 코드, 발급된 쿠폰을 한 화면에서 관리합니다.</CardDescription>
          </div>
          <Input
            className="max-w-sm"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="ID, 쿠폰명, 회원명, 학번, 이메일, 코드, 설명 검색"
          />
        </CardHeader>
      </Card>

      <Tabs value={tab} onValueChange={(value) => setTab(value as CouponTab)}>
        <TabsList>
          <TabsTrigger value="coupon">쿠폰</TabsTrigger>
          <TabsTrigger value="code">쿠폰 코드</TabsTrigger>
          <TabsTrigger value="issued">발급된 쿠폰</TabsTrigger>
        </TabsList>

        <TabsContent value="coupon" className="space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-end gap-3 p-5">
              <div className="min-w-[220px] space-y-2">
                <Label>쿠폰 이름</Label>
                <Input
                  value={newCouponName}
                  onChange={(event) => setNewCouponName(event.target.value)}
                  placeholder="예) 2026 신입생 환영 쿠폰"
                />
              </div>
              <div className="w-[200px] space-y-2">
                <Label>할인 금액</Label>
                <Input
                  type="number"
                  min={1}
                  value={newDiscountAmount}
                  onChange={(event) => setNewDiscountAmount(event.target.value)}
                />
              </div>
              <Button onClick={() => void handleCreateCoupon()}>쿠폰 생성</Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">ID</TableHead>
                    <TableHead>쿠폰 이름</TableHead>
                    <TableHead className="w-36 text-right">할인 금액</TableHead>
                    <TableHead className="w-[280px]">이름 수정</TableHead>
                    <TableHead className="w-28 text-right">삭제</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoupons.map((coupon) => (
                    <TableRow key={coupon.couponId}>
                      <TableCell>{coupon.couponId}</TableCell>
                      <TableCell>{coupon.couponName}</TableCell>
                      <TableCell className="text-right">
                        {Number(coupon.discountAmount).toLocaleString("ko-KR")}원
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Input
                            value={couponNameDrafts[coupon.couponId] ?? coupon.couponName}
                            onChange={(event) => {
                              setCouponNameDrafts((prev) => ({
                                ...prev,
                                [coupon.couponId]: event.target.value,
                              }))
                            }}
                          />
                          <Button variant="outline" onClick={() => void handleUpdateCouponName(coupon.couponId)}>
                            저장
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="sm" onClick={() => void handleDeleteCoupon(coupon.couponId)}>
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-end gap-3 p-5">
              <div className="min-w-[260px] space-y-2">
                <Label>코드 생성 대상 쿠폰</Label>
                <Select
                  value={selectedCouponIdForCode ? String(selectedCouponIdForCode) : ""}
                  onValueChange={(value) => setSelectedCouponIdForCode(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="쿠폰 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {coupons.map((coupon) => (
                      <SelectItem key={coupon.couponId} value={String(coupon.couponId)}>
                        [{coupon.couponId}] {coupon.couponName} ({Number(coupon.discountAmount).toLocaleString("ko-KR")}원)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[320px] flex-1 space-y-2">
                <Label>설명 (선택)</Label>
                <Input
                  value={newCouponCodeDescription}
                  onChange={(event) => setNewCouponCodeDescription(event.target.value)}
                  placeholder="예) 26학번 단톡방 공지용"
                  maxLength={255}
                />
              </div>
              <Button onClick={() => void handleCreateCouponCode()}>코드 생성</Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>코드 ID</TableHead>
                    <TableHead>쿠폰 ID</TableHead>
                    <TableHead>코드</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>사용 시각</TableHead>
                    <TableHead className="text-right">삭제</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCouponCodes.map((couponCode) => (
                    <TableRow key={couponCode.codeCouponId}>
                      <TableCell>{couponCode.codeCouponId}</TableCell>
                      <TableCell>{couponCode.couponId}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{couponCode.code}</TableCell>
                      <TableCell className="max-w-[260px] truncate" title={couponCode.description ?? ""}>
                        {couponCode.description ?? "-"}
                      </TableCell>
                      <TableCell>{couponCode.isValid ? "사용 가능" : `사용 완료 (${couponCode.couponName})`}</TableCell>
                      <TableCell>{formatDateTime(couponCode.usedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void handleDeleteCouponCode(couponCode.codeCouponId)}
                          disabled={!couponCode.isValid}
                        >
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issued" className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[280px] space-y-2">
                  <Label>발급할 쿠폰</Label>
                  <Select
                    value={selectedCouponIdForIssue ? String(selectedCouponIdForIssue) : ""}
                    onValueChange={(value) => setSelectedCouponIdForIssue(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="쿠폰 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {coupons.map((coupon) => (
                        <SelectItem key={coupon.couponId} value={String(coupon.couponId)}>
                          [{coupon.couponId}] {coupon.couponName} ({Number(coupon.discountAmount).toLocaleString("ko-KR")}원)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => void handleCreateIssuedCoupons()}>선택 회원 쿠폰 발급</Button>
              </div>

              <div className="space-y-2">
                <Label>발급 대상 회원</Label>
                <Input
                  value={memberSearchText}
                  onChange={(event) => setMemberSearchText(event.target.value)}
                  placeholder="회원 ID, 이름, 학번, 이메일, 권한 검색"
                />

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllFilteredMembers}
                    disabled={filteredMembersForIssue.length === 0 || isAllFilteredMembersSelected}
                  >
                    검색 결과 전체 선택
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilteredMembers}
                    disabled={filteredMembersForIssue.length === 0}
                  >
                    검색 결과 선택 해제
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAllSelectedMembers}
                    disabled={selectedMemberIdsForIssue.length === 0}
                  >
                    전체 선택 해제
                  </Button>
                  <Badge variant="secondary">
                    총 {filteredMembersForIssue.length}명 중 {selectedAmongFilteredCount}명 선택
                  </Badge>
                  <Badge variant="outline">전체 선택 {selectedMemberIdsForIssue.length}명</Badge>
                </div>

                <ScrollArea className="h-56 rounded-lg border bg-background p-2">
                  {filteredMembersForIssue.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      검색 조건에 맞는 회원이 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredMembersForIssue.map((member) => (
                        <label
                          key={member.memberId}
                          className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 hover:bg-accent"
                        >
                          <Checkbox
                            checked={selectedMemberIdSet.has(member.memberId)}
                            onCheckedChange={() => handleToggleMemberForIssue(member.memberId)}
                          />
                          <span className="text-sm">
                            [{member.memberId}] {member.name} ({member.studentId ?? "학번 미입력"}, {member.email}) - {member.role}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>발급 ID</TableHead>
                    <TableHead>쿠폰</TableHead>
                    <TableHead>회원</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>결제 ID</TableHead>
                    <TableHead>사용 시각</TableHead>
                    <TableHead className="text-right">삭제</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssuedCoupons.map((issuedCoupon) => (
                    <TableRow key={issuedCoupon.issuedCouponId}>
                      <TableCell>{issuedCoupon.issuedCouponId}</TableCell>
                      <TableCell>
                        [{issuedCoupon.couponId}] {issuedCoupon.couponName} ({Number(issuedCoupon.discountAmount).toLocaleString("ko-KR")}원)
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            [{issuedCoupon.memberId}] {issuedCoupon.memberName}
                          </div>
                          <div className="text-muted-foreground">{issuedCoupon.memberEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{issuedCoupon.isValid ? "미사용" : "사용됨"}</TableCell>
                      <TableCell>{issuedCoupon.paymentId ?? "-"}</TableCell>
                      <TableCell>{formatDateTime(issuedCoupon.usedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void handleDeleteIssuedCoupon(issuedCoupon.issuedCouponId)}
                          disabled={!issuedCoupon.isValid}
                        >
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isDataLoading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">데이터를 불러오는 중입니다.</CardContent>
        </Card>
      )}

      {!isDataLoading && currentRows.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">조건에 맞는 데이터가 없습니다.</CardContent>
        </Card>
      )}
    </div>
  )
}

export default CouponPage
