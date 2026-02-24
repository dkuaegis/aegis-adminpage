import { useEffect, useMemo, useState } from "react"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { showConfirm, showError, showSuccess } from "@/utils/alert"

type PointTransactionFilter = "ALL" | PointTransactionType

function mapErrorMessage(errorName?: string): string {
  switch (errorName) {
    case "MEMBER_NOT_FOUND":
      return "회원을 찾을 수 없습니다."
    case "POINT_ACCOUNT_NOT_FOUND":
      return "포인트 계정을 찾을 수 없습니다."
    case "POINT_ACTION_AMOUNT_NOT_POSITIVE":
      return "포인트 금액은 0보다 커야 합니다."
    case "BAD_REQUEST":
      return "요청 값이 올바르지 않습니다."
    default:
      return "요청 처리에 실패했습니다."
  }
}

function formatDateTime(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return "-"
  }
  return parsed.toLocaleString("ko-KR", { hour12: false })
}

function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16)
    const value = char === "x" ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

const PointPage: React.FC = () => {
  const [isLedgerLoading, setIsLedgerLoading] = useState(false)
  const [ledgerData, setLedgerData] = useState<AdminPointLedgerPage | null>(null)
  const [ledgerPage, setLedgerPage] = useState(0)
  const [ledgerMemberKeyword, setLedgerMemberKeyword] = useState("")
  const [ledgerTransactionType, setLedgerTransactionType] = useState<PointTransactionFilter>("ALL")
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
    page: number,
    memberKeyword: string,
    transactionType: PointTransactionFilter,
    from: string,
    to: string,
  ): Promise<void> => {
    setIsLedgerLoading(true)
    const response = await getPointLedger({
      page,
      size: 50,
      memberKeyword,
      transactionType: transactionType === "ALL" ? undefined : transactionType,
      from: from || undefined,
      to: to || undefined,
    })

    if (!response.ok || !response.data) {
      showError(mapErrorMessage(response.errorName))
      setIsLedgerLoading(false)
      return
    }

    setLedgerData(response.data)
    setIsLedgerLoading(false)
  }

  const fetchMemberPoint = async (memberId: number): Promise<void> => {
    setIsMemberPointLoading(true)
    const response = await getPointMember(memberId)
    if (!response.ok || !response.data) {
      showError(mapErrorMessage(response.errorName))
      setIsMemberPointLoading(false)
      return
    }

    setSelectedDetailMemberId(memberId)
    setMemberPoint(response.data)
    setSingleMemberId(memberId)
    setIsMemberPointLoading(false)
  }

  useEffect(() => {
    void fetchLedger(0, ledgerMemberKeyword, ledgerTransactionType, ledgerFrom, ledgerTo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setLedgerPage(0)
    await fetchLedger(0, ledgerMemberKeyword, ledgerTransactionType, ledgerFrom, ledgerTo)
  }

  const moveLedgerPage = async (nextPage: number): Promise<void> => {
    if (nextPage < 0) {
      return
    }
    setLedgerPage(nextPage)
    await fetchLedger(nextPage, ledgerMemberKeyword, ledgerTransactionType, ledgerFrom, ledgerTo)
  }

  const handleSearchMembers = async (): Promise<void> => {
    if (memberSearchKeyword.trim().length < 2) {
      showError("회원 검색어는 2글자 이상 입력해주세요.")
      return
    }

    setIsMemberSearchLoading(true)
    const response = await searchPointMembers(memberSearchKeyword, 20)
    if (!response.ok || !response.data) {
      showError(mapErrorMessage(response.errorName))
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
      showError(mapErrorMessage(response.errorName))
      setIsSingleSubmitting(false)
      return
    }

    if (response.data.created) {
      showSuccess("포인트를 지급했습니다.")
    } else {
      showSuccess("중복 요청으로 추가 지급되지 않았습니다.")
    }

    setSingleAmount("")
    await fetchLedger(ledgerPage, ledgerMemberKeyword, ledgerTransactionType, ledgerFrom, ledgerTo)
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
      showError(mapErrorMessage(response.errorName))
      setIsBatchSubmitting(false)
      return
    }

    setBatchResult(response.data)
    showSuccess(
      `일괄 지급 완료: 성공 ${response.data.successCount} / 중복 ${response.data.duplicateCount} / 실패 ${response.data.failureCount}`,
    )

    setBatchAmount("")
    await fetchLedger(ledgerPage, ledgerMemberKeyword, ledgerTransactionType, ledgerFrom, ledgerTo)
    if (selectedDetailMemberId !== null) {
      await fetchMemberPoint(selectedDetailMemberId)
    }
    setIsBatchSubmitting(false)
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">포인트 관리</CardTitle>
          <CardDescription>통합 원장 조회, 회원별 조회, 수동 지급(단건/일괄)을 처리합니다.</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>통합 포인트 원장</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <Input
              value={ledgerMemberKeyword}
              onChange={(event) => setLedgerMemberKeyword(event.target.value)}
              placeholder="회원명/학번"
            />

            <Select value={ledgerTransactionType} onValueChange={(value) => setLedgerTransactionType(value as PointTransactionFilter)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 유형</SelectItem>
                <SelectItem value="EARN">적립</SelectItem>
                <SelectItem value="SPEND">차감</SelectItem>
              </SelectContent>
            </Select>

            <Input type="date" value={ledgerFrom} onChange={(event) => setLedgerFrom(event.target.value)} />
            <Input type="date" value={ledgerTo} onChange={(event) => setLedgerTo(event.target.value)} />
            <Button onClick={() => void handleLedgerSearch()} disabled={isLedgerLoading}>
              조회
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시간</TableHead>
                  <TableHead>회원</TableHead>
                  <TableHead>학번</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>사유</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerData?.content.map((row) => (
                  <TableRow key={row.pointTransactionId}>
                    <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                    <TableCell>{row.memberName}</TableCell>
                    <TableCell>{row.studentId ?? "-"}</TableCell>
                    <TableCell>{row.transactionType === "EARN" ? "적립" : "차감"}</TableCell>
                    <TableCell>{row.amount}</TableCell>
                    <TableCell>{row.reason}</TableCell>
                  </TableRow>
                ))}

                {(ledgerData?.content.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-16 text-center text-muted-foreground">
                      {isLedgerLoading ? "원장을 불러오는 중..." : "조회 결과가 없습니다."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
              총 {ledgerData?.totalElements ?? 0}건 / {ledgerData ? ledgerData.page + 1 : 1}페이지
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void moveLedgerPage(ledgerPage - 1)}
                disabled={isLedgerLoading || ledgerPage <= 0}
              >
                이전
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void moveLedgerPage(ledgerPage + 1)}
                disabled={isLedgerLoading || !(ledgerData?.hasNext ?? false)}
              >
                다음
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>회원별 조회 / 지급 대상 선택</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={memberSearchKeyword}
              onChange={(event) => setMemberSearchKeyword(event.target.value)}
              placeholder="학번 또는 이름으로 검색 (2자 이상)"
            />
            <Button onClick={() => void handleSearchMembers()} disabled={isMemberSearchLoading}>
              검색
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>선택</TableHead>
                  <TableHead>회원명</TableHead>
                  <TableHead>학번</TableHead>
                  <TableHead>회원ID</TableHead>
                  <TableHead>동작</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberSearchResults.map((member) => (
                  <TableRow key={member.memberId}>
                    <TableCell>
                      <Checkbox
                        checked={selectedBatchMemberIdSet.has(member.memberId)}
                        onCheckedChange={() => toggleBatchMember(member)}
                      />
                    </TableCell>
                    <TableCell>{member.memberName}</TableCell>
                    <TableCell>{member.studentId ?? "-"}</TableCell>
                    <TableCell>{member.memberId}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => void fetchMemberPoint(member.memberId)}>
                        상세 조회
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {memberSearchResults.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">
                      {isMemberSearchLoading ? "회원 검색 중..." : "검색 결과가 없습니다."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <h3 className="font-semibold">회원 상세</h3>
            {isMemberPointLoading && <div className="text-sm text-muted-foreground">회원 정보를 불러오는 중...</div>}

            {!isMemberPointLoading && memberPoint && (
              <>
                <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-5">
                  <div>회원명: {memberPoint.memberName}</div>
                  <div>학번: {memberPoint.studentId ?? "-"}</div>
                  <div>회원ID: {memberPoint.memberId}</div>
                  <div>잔액: {memberPoint.balance}</div>
                  <div>누적 적립: {memberPoint.totalEarned}</div>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>시간</TableHead>
                        <TableHead>유형</TableHead>
                        <TableHead>금액</TableHead>
                        <TableHead>사유</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberPoint.recentHistory.map((history) => (
                        <TableRow key={history.pointTransactionId}>
                          <TableCell>{formatDateTime(history.createdAt)}</TableCell>
                          <TableCell>{history.transactionType === "EARN" ? "적립" : "차감"}</TableCell>
                          <TableCell>{history.amount}</TableCell>
                          <TableCell>{history.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {!isMemberPointLoading && !memberPoint && (
              <div className="text-sm text-muted-foreground">상세 조회할 회원을 선택해주세요.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>수동 지급</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="font-semibold">단건 지급</h3>

              <Select
                value={singleMemberId ? String(singleMemberId) : ""}
                onValueChange={(value) => setSingleMemberId(value ? Number(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="지급 대상 선택" />
                </SelectTrigger>
                <SelectContent>
                  {memberSearchResults.map((member) => (
                    <SelectItem key={member.memberId} value={String(member.memberId)}>
                      {member.memberName} ({member.studentId ?? "-"}, ID:{member.memberId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                min={1}
                step={1}
                value={singleAmount}
                onChange={(event) => setSingleAmount(event.target.value)}
                placeholder="지급 포인트"
              />
              <Textarea
                value={singleReason}
                onChange={(event) => setSingleReason(event.target.value)}
                placeholder="지급 사유"
                maxLength={200}
              />
              <Button className="w-full" onClick={() => void handleSingleGrant()} disabled={isSingleSubmitting}>
                {isSingleSubmitting ? "지급 중..." : "단건 지급"}
              </Button>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="font-semibold">일괄 지급 (선택 {selectedBatchMemberIds.length}명)</h3>

              <div className="max-h-28 space-y-1 overflow-y-auto rounded-md border p-2">
                {selectedBatchMembers.length === 0 && <div className="text-sm text-muted-foreground">선택된 회원이 없습니다.</div>}
                {selectedBatchMembers.map((member) => (
                  <div key={member.memberId} className="text-sm">
                    {member.memberName} ({member.studentId ?? "-"}, ID:{member.memberId})
                  </div>
                ))}
              </div>

              <Input
                type="number"
                min={1}
                step={1}
                value={batchAmount}
                onChange={(event) => setBatchAmount(event.target.value)}
                placeholder="지급 포인트"
              />
              <Textarea
                value={batchReason}
                onChange={(event) => setBatchReason(event.target.value)}
                placeholder="지급 사유"
                maxLength={200}
              />
              <Button className="w-full" onClick={() => void handleBatchGrant()} disabled={isBatchSubmitting}>
                {isBatchSubmitting ? "일괄 지급 중..." : "일괄 지급"}
              </Button>
            </div>
          </div>

          {batchResult && (
            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="font-semibold">일괄 지급 결과</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">요청 {batchResult.totalRequested}건</Badge>
                <Badge variant="secondary">성공 {batchResult.successCount}</Badge>
                <Badge variant="secondary">중복 {batchResult.duplicateCount}</Badge>
                <Badge variant="secondary">실패 {batchResult.failureCount}</Badge>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>회원ID</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>거래ID</TableHead>
                      <TableHead>잔액</TableHead>
                      <TableHead>오류</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchResult.results.map((result, index) => (
                      <TableRow key={`${result.memberId}-${index}`}>
                        <TableCell>{result.memberId}</TableCell>
                        <TableCell>{result.status}</TableCell>
                        <TableCell>{result.pointTransactionId ?? "-"}</TableCell>
                        <TableCell>{result.newBalance ?? "-"}</TableCell>
                        <TableCell>{result.errorName ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PointPage
