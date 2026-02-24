import type { AdminCoupon, AdminIssuedCoupon, AdminMemberSummary } from "@/api/coupon/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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

interface CouponIssuedTabSectionProps {
  coupons: AdminCoupon[]
  selectedCouponIdForIssue: number
  onSelectedCouponIdForIssueChange: (couponId: number) => void
  onCreateIssuedCoupons: () => Promise<void>
  memberSearchText: string
  onMemberSearchTextChange: (value: string) => void
  filteredMembersForIssue: AdminMemberSummary[]
  selectedMemberIdSet: Set<number>
  isAllFilteredMembersSelected: boolean
  selectedAmongFilteredCount: number
  selectedMemberIdsForIssue: number[]
  onSelectAllFilteredMembers: () => void
  onClearFilteredMembers: () => void
  onClearAllSelectedMembers: () => void
  onToggleMemberForIssue: (memberId: number) => void
  filteredIssuedCoupons: AdminIssuedCoupon[]
  onDeleteIssuedCoupon: (issuedCouponId: number) => Promise<void>
  formatDateTime: (value: string | null) => string
}

export const CouponIssuedTabSection: React.FC<CouponIssuedTabSectionProps> = ({
  coupons,
  selectedCouponIdForIssue,
  onSelectedCouponIdForIssueChange,
  onCreateIssuedCoupons,
  memberSearchText,
  onMemberSearchTextChange,
  filteredMembersForIssue,
  selectedMemberIdSet,
  isAllFilteredMembersSelected,
  selectedAmongFilteredCount,
  selectedMemberIdsForIssue,
  onSelectAllFilteredMembers,
  onClearFilteredMembers,
  onClearAllSelectedMembers,
  onToggleMemberForIssue,
  filteredIssuedCoupons,
  onDeleteIssuedCoupon,
  formatDateTime,
}) => {
  return (
    <>
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[280px] space-y-2">
              <Label>발급할 쿠폰</Label>
              <Select
                value={selectedCouponIdForIssue ? String(selectedCouponIdForIssue) : ""}
                onValueChange={(value) => onSelectedCouponIdForIssueChange(Number(value))}
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
            <Button onClick={() => void onCreateIssuedCoupons()}>선택 회원 쿠폰 발급</Button>
          </div>

          <div className="space-y-2">
            <Label>발급 대상 회원</Label>
            <Input
              value={memberSearchText}
              onChange={(event) => onMemberSearchTextChange(event.target.value)}
              placeholder="회원 ID, 이름, 학번, 이메일, 권한 검색"
            />

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Button
                variant="outline"
                size="sm"
                onClick={onSelectAllFilteredMembers}
                disabled={filteredMembersForIssue.length === 0 || isAllFilteredMembersSelected}
              >
                검색 결과 전체 선택
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilteredMembers}
                disabled={filteredMembersForIssue.length === 0}
              >
                검색 결과 선택 해제
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAllSelectedMembers}
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
                        onCheckedChange={() => onToggleMemberForIssue(member.memberId)}
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
                      onClick={() => void onDeleteIssuedCoupon(issuedCoupon.issuedCouponId)}
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
    </>
  )
}
