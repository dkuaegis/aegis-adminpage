import type { AdminPointMemberPoint, AdminPointMemberSearch } from "@/api/point/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type PointMemberSectionProps = {
  memberSearchKeyword: string
  isMemberSearchLoading: boolean
  memberSearchResults: AdminPointMemberSearch[]
  selectedBatchMemberIdSet: Set<number>
  isMemberPointLoading: boolean
  memberPoint: AdminPointMemberPoint | null
  onMemberSearchKeywordChange: (value: string) => void
  onSearchMembers: () => Promise<void>
  onToggleBatchMember: (member: AdminPointMemberSearch) => void
  onFetchMemberPoint: (memberId: number) => Promise<void>
  formatDateTime: (value: string) => string
}

export const PointMemberSection: React.FC<PointMemberSectionProps> = ({
  memberSearchKeyword,
  isMemberSearchLoading,
  memberSearchResults,
  selectedBatchMemberIdSet,
  isMemberPointLoading,
  memberPoint,
  onMemberSearchKeywordChange,
  onSearchMembers,
  onToggleBatchMember,
  onFetchMemberPoint,
  formatDateTime,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>회원별 조회 / 지급 대상 선택</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={memberSearchKeyword}
            onChange={(event) => onMemberSearchKeywordChange(event.target.value)}
            placeholder="학번 또는 이름으로 검색 (2자 이상)"
          />
          <Button onClick={() => void onSearchMembers()} disabled={isMemberSearchLoading}>
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
                      onCheckedChange={() => onToggleBatchMember(member)}
                    />
                  </TableCell>
                  <TableCell>{member.memberName}</TableCell>
                  <TableCell>{member.studentId ?? "-"}</TableCell>
                  <TableCell>{member.memberId}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => void onFetchMemberPoint(member.memberId)}>
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
  )
}
